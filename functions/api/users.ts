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
      SELECT u.id, u.email, u.role, u.client_id, u.created_at, c.name as client_name
      FROM users u
      LEFT JOIN clients c ON u.client_id = c.id
      ORDER BY u.created_at DESC
    `).all();

    return new Response(JSON.stringify(results), {
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
    const { email, password, role, clientId } = body;

    if (!email || !password || !role) {
      return new Response(JSON.stringify({ error: 'E-mail, senha e nível de acesso são obrigatórios' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    if (role === 'client' && !clientId) {
      return new Response(JSON.stringify({ error: 'Clientes precisam estar associados a uma empresa' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const passwordHash = await hashPassword(password);
    const userId = 'u_' + Math.random().toString(36).substring(2, 8);
    const createdAt = Date.now();

    await context.env.DB.prepare(`
      INSERT INTO users (id, email, password_hash, role, client_id, created_at)
      VALUES (?, ?, ?, ?, ?, ?)
    `).bind(
      userId,
      email.toLowerCase().trim(),
      passwordHash,
      role,
      role === 'admin' ? null : clientId,
      createdAt
    ).run();

    return new Response(JSON.stringify({
      success: true,
      user: { id: userId, email, role, clientId, created_at: createdAt }
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
