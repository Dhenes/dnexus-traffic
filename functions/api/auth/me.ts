import { getAuthUser } from '../utils/auth';

interface Env {
  DB: D1Database;
  JWT_SECRET?: string;
}

const DEFAULT_SECRET = 'dnexus_super_secret_key_2026';

export const onRequestGet: PagesFunction<Env> = async (context) => {
  try {
    const secret = context.env.JWT_SECRET || DEFAULT_SECRET;
    const authUser = await getAuthUser(context.request, secret);

    if (!authUser) {
      return new Response(JSON.stringify({ error: 'Não autorizado' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Buscar informações atualizadas do usuário no D1
    const userRow: any = await context.env.DB.prepare(`
      SELECT id, email, role
      FROM users
      WHERE id = ?
    `).bind(authUser.userId).first();

    if (!userRow) {
      return new Response(JSON.stringify({ error: 'Usuário não encontrado' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Consultar as empresas (clients) que este usuário possui acesso
    let userClients: any[] = [];
    if (userRow.role === 'admin') {
      const allClients = await context.env.DB.prepare(
        'SELECT id, name FROM clients ORDER BY name ASC'
      ).all();
      userClients = allClients.results || [];
    } else {
      const dbClients = await context.env.DB.prepare(`
        SELECT c.id, c.name 
        FROM user_clients uc 
        JOIN clients c ON uc.client_id = c.id 
        WHERE uc.user_id = ?
        ORDER BY c.name ASC
      `).bind(userRow.id).all();
      userClients = dbClients.results || [];
    }

    return new Response(JSON.stringify({
      user: {
        id: userRow.id,
        email: userRow.email,
        role: userRow.role,
        clients: userClients,
        clientId: userClients[0]?.id || '',
        clientName: userClients[0]?.name || ''
      }
    }), {
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error: any) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};
