import { getAuthUser, hashPassword } from './utils/auth';

interface Env {
  DB: D1Database;
  JWT_SECRET?: string;
}

const DEFAULT_SECRET = 'dnexus_super_secret_key_2026';

export const onRequestGet: PagesFunction<Env> = async (context) => {
  try {
    const secret = context.env.JWT_SECRET || DEFAULT_SECRET;
    const authUser = await getAuthUser(context.request, secret);

    if (!authUser || authUser.role !== 'admin') {
      return new Response(JSON.stringify({ error: 'Acesso negado' }), {
        status: 403,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const { results } = await context.env.DB.prepare(`
      SELECT u.id, u.email, u.username, u.role, u.created_at,
             group_concat(uc.client_id) as client_ids,
             group_concat(c.name) as client_names
      FROM users u
      LEFT JOIN user_clients uc ON u.id = uc.user_id
      LEFT JOIN clients c ON uc.client_id = c.id
      GROUP BY u.id
      ORDER BY u.created_at DESC
    `).all();

    const mappedResults = (results || []).map((u: any) => {
      const clientIds = u.client_ids ? u.client_ids.split(',') : [];
      const clientNames = u.client_names ? u.client_names.split(',') : [];
      return {
        id: u.id,
        email: u.email,
        username: u.username || '',
        role: u.role,
        created_at: u.created_at,
        clientIds,
        clientNames,
        client_id: clientIds[0] || '',
        client_name: clientNames[0] || ''
      };
    });

    return new Response(JSON.stringify(mappedResults), {
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error: any) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};

export const onRequestPost: PagesFunction<Env> = async (context) => {
  try {
    const secret = context.env.JWT_SECRET || DEFAULT_SECRET;
    const authUser = await getAuthUser(context.request, secret);

    if (!authUser || authUser.role !== 'admin') {
      return new Response(JSON.stringify({ error: 'Acesso negado' }), {
        status: 403,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const body: any = await context.request.json();
    const { email, username, password, role, clientId, clientIds } = body;

    if (!email || !password || !role) {
      return new Response(JSON.stringify({ error: 'E-mail, senha e nível de acesso são obrigatórios' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const selectedClientIds: string[] = Array.isArray(clientIds)
      ? clientIds
      : (clientId ? [clientId] : []);

    if (role === 'client' && selectedClientIds.length === 0) {
      return new Response(JSON.stringify({ error: 'Clientes precisam estar associados a pelo menos uma empresa' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const userUsername = (username && username.trim()) || email.split('@')[0].toLowerCase().trim();

    const passwordHash = await hashPassword(password);
    const userId = 'u_' + Math.random().toString(36).substring(2, 8);
    const createdAt = Date.now();

    const batchStatements: D1PreparedStatement[] = [
      context.env.DB.prepare(`
        INSERT INTO users (id, email, username, password_hash, role, client_id, created_at)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `).bind(
        userId,
        email.toLowerCase().trim(),
        userUsername,
        passwordHash,
        role,
        role === 'admin' ? null : (selectedClientIds[0] || null),
        createdAt
      )
    ];

    if (role !== 'admin') {
      for (const cId of selectedClientIds) {
        batchStatements.push(
          context.env.DB.prepare('INSERT INTO user_clients (user_id, client_id) VALUES (?, ?)')
            .bind(userId, cId)
        );
      }
    }

    await context.env.DB.batch(batchStatements);

    return new Response(JSON.stringify({
      success: true,
      user: {
        id: userId,
        email,
        username: userUsername,
        role,
        clientIds: selectedClientIds,
        clientId: selectedClientIds[0] || '',
        created_at: createdAt
      }
    }), {
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error: any) {
    // Treat unique constraint failure on email
    if (error.message.includes('UNIQUE constraint failed')) {
      return new Response(JSON.stringify({ error: 'Este endereço de e-mail já está em uso' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};

export const onRequestPut: PagesFunction<Env> = async (context) => {
  try {
    const secret = context.env.JWT_SECRET || DEFAULT_SECRET;
    const authUser = await getAuthUser(context.request, secret);

    if (!authUser || authUser.role !== 'admin') {
      return new Response(JSON.stringify({ error: 'Acesso negado' }), {
        status: 403,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const body: any = await context.request.json();
    const { id, email, username, password, role, clientId, clientIds } = body;

    if (!id || !email || !role) {
      return new Response(JSON.stringify({ error: 'ID, e-mail e nível de acesso são obrigatórios' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const selectedClientIds: string[] = Array.isArray(clientIds)
      ? clientIds
      : (clientId ? [clientId] : []);

    if (role === 'client' && selectedClientIds.length === 0) {
      return new Response(JSON.stringify({ error: 'Clientes precisam estar associados a pelo menos uma empresa' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const userUsername = (username && username.trim()) || email.split('@')[0].toLowerCase().trim();

    let query = '';
    let params: any[] = [];
    const firstClientId = selectedClientIds[0] || null;

    if (password && password.trim().length > 0) {
      const passwordHash = await hashPassword(password);
      query = 'UPDATE users SET email = ?, username = ?, password_hash = ?, role = ?, client_id = ? WHERE id = ?';
      params = [email.toLowerCase().trim(), userUsername, passwordHash, role, role === 'admin' ? null : firstClientId, id];
    } else {
      query = 'UPDATE users SET email = ?, username = ?, role = ?, client_id = ? WHERE id = ?';
      params = [email.toLowerCase().trim(), userUsername, role, role === 'admin' ? null : firstClientId, id];
    }

    const batchStatements: D1PreparedStatement[] = [
      context.env.DB.prepare(query).bind(...params),
      context.env.DB.prepare('DELETE FROM user_clients WHERE user_id = ?').bind(id)
    ];

    if (role !== 'admin') {
      for (const cId of selectedClientIds) {
        batchStatements.push(
          context.env.DB.prepare('INSERT INTO user_clients (user_id, client_id) VALUES (?, ?)')
            .bind(id, cId)
        );
      }
    }

    await context.env.DB.batch(batchStatements);

    return new Response(JSON.stringify({ success: true }), {
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error: any) {
    if (error.message.includes('UNIQUE constraint failed')) {
      return new Response(JSON.stringify({ error: 'Este endereço de e-mail já está em uso' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};

export const onRequestDelete: PagesFunction<Env> = async (context) => {
  try {
    const secret = context.env.JWT_SECRET || DEFAULT_SECRET;
    const authUser = await getAuthUser(context.request, secret);

    if (!authUser || authUser.role !== 'admin') {
      return new Response(JSON.stringify({ error: 'Acesso negado' }), {
        status: 403,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const url = new URL(context.request.url);
    const id = url.searchParams.get('id');

    if (!id) {
      return new Response(JSON.stringify({ error: 'ID do usuário é obrigatório' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Não permitir que o administrador exclua a si mesmo
    if (id === authUser.id) {
      return new Response(JSON.stringify({ error: 'Você não pode excluir o seu próprio usuário' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    await context.env.DB.prepare('DELETE FROM users WHERE id = ?').bind(id).run();

    return new Response(JSON.stringify({ success: true }), {
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error: any) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};
