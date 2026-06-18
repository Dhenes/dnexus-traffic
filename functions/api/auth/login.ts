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

    // Consultar usuário no D1 (por e-mail ou nome de usuário)
    const userRow: any = await context.env.DB.prepare(`
      SELECT id, email, password_hash, role
      FROM users
      WHERE email = ? OR username = ?
    `).bind(email.toLowerCase().trim(), email.toLowerCase().trim()).first();

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

    // Criar o token JWT (mantém o primeiro clientId para compatibilidade retroativa)
    const payload = {
      userId: userRow.id,
      role: userRow.role,
      clientId: userClients[0]?.id || ''
    };

    const token = await generateJWT(payload, secret);

    return new Response(JSON.stringify({
      token,
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
