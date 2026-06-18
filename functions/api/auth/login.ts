import { hashPassword, generateJWT } from '../utils/auth';

interface Env {
  DB: D1Database;
  JWT_SECRET?: string;
}

const DEFAULT_SECRET = 'dnexus_super_secret_key_2026';

export const onRequestPost: PagesFunction<Env> = async (context) => {
  try {
    const body: any = await context.request.json();
    const { email, password } = body;

    if (!email || !password) {
      return new Response(JSON.stringify({ error: 'E-mail e senha são obrigatórios' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const secret = context.env.JWT_SECRET || DEFAULT_SECRET;

    // Consultar usuário e seu respectivo cliente no D1
    const userRow: any = await context.env.DB.prepare(`
      SELECT u.id, u.email, u.password_hash, u.role, u.client_id, c.name as client_name
      FROM users u
      LEFT JOIN clients c ON u.client_id = c.id
      WHERE u.email = ?
    `).bind(email.toLowerCase().trim()).first();

    if (!userRow) {
      return new Response(JSON.stringify({ error: 'Credenciais inválidas' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Hash da senha enviada
    const hashedInput = await hashPassword(password);

    if (hashedInput !== userRow.password_hash) {
      return new Response(JSON.stringify({ error: 'Credenciais inválidas' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Criar o token JWT
    const payload = {
      userId: userRow.id,
      role: userRow.role,
      clientId: userRow.client_id || ''
    };

    const token = await generateJWT(payload, secret);

    return new Response(JSON.stringify({
      token,
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
