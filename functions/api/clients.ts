import { getAuthUser } from './utils/auth';

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

    const { results } = await context.env.DB.prepare(
      'SELECT id, name, created_at FROM clients ORDER BY name ASC'
    ).all();

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
    const { name } = body;

    if (!name || !name.trim()) {
      return new Response(JSON.stringify({ error: 'Nome do cliente é obrigatório' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Gerar um ID de cliente aleatório curto
    const id = 'c_' + Math.random().toString(36).substring(2, 8);
    const createdAt = Date.now();

    await context.env.DB.prepare(
      'INSERT INTO clients (id, name, created_at) VALUES (?, ?, ?)'
    ).bind(id, name.trim(), createdAt).run();

    return new Response(JSON.stringify({ success: true, client: { id, name, created_at: createdAt } }), {
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error: any) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};
