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

    // Buscar informações atualizadas do usuário e cliente no D1
    const userRow: any = await context.env.DB.prepare(`
      SELECT u.id, u.email, u.role, u.client_id, c.name as client_name
      FROM users u
      LEFT JOIN clients c ON u.client_id = c.id
      WHERE u.id = ?
    `).bind(authUser.userId).first();

    if (!userRow) {
      return new Response(JSON.stringify({ error: 'Usuário não encontrado' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    return new Response(JSON.stringify({
      user: {
        id: userRow.id,
        email: userRow.email,
        role: userRow.role,
        clientId: userRow.client_id || '',
        clientName: userRow.client_name || ''
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
