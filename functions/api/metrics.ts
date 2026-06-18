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

    if (!authUser) {
      return new Response(JSON.stringify({ error: 'Não autorizado' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const url = new URL(context.request.url);
    const range = url.searchParams.get('range') || '30d';
    let targetClientId = url.searchParams.get('clientId');

    // Se for cliente comum, verifica se ele tem acesso a este cliente
    if (authUser.role !== 'admin') {
      if (!targetClientId) {
        return new Response(JSON.stringify({ error: 'Nenhum cliente selecionado' }), {
          status: 400,
          headers: { 'Content-Type': 'application/json' }
        });
      }
      const hasAccess = await context.env.DB.prepare(
        'SELECT 1 FROM user_clients WHERE user_id = ? AND client_id = ?'
      ).bind(authUser.userId, targetClientId).first();
      
      if (!hasAccess) {
        return new Response(JSON.stringify({ error: 'Acesso negado a esta empresa' }), {
          status: 403,
          headers: { 'Content-Type': 'application/json' }
        });
      }
    }

    // Se admin não selecionou nenhum cliente, retorna arrays vazios
    if (!targetClientId) {
      return new Response(
        JSON.stringify({ meta: [], google: [], tiktok: [] }),
        { headers: { 'Content-Type': 'application/json' } }
      );
    }

    const today = new Date();
    let cutoffDate = new Date();

    if (range === '7d') {
      cutoffDate.setDate(today.getDate() - 7);
    } else if (range === '30d') {
      cutoffDate.setDate(today.getDate() - 30);
    } else if (range === 'this_month') {
      cutoffDate.setDate(1);
    } else {
      cutoffDate.setDate(today.getDate() - 30);
    }

    const cutoffStr = cutoffDate.toISOString().split('T')[0];

    // Prepare queries filtrando estritamente por client_id
    const metaStmt = context.env.DB.prepare(
      'SELECT * FROM meta_daily_metrics WHERE client_id = ? AND date >= ? ORDER BY date DESC'
    ).bind(targetClientId, cutoffStr);

    const googleStmt = context.env.DB.prepare(
      'SELECT * FROM google_daily_metrics WHERE client_id = ? AND date >= ? ORDER BY date DESC'
    ).bind(targetClientId, cutoffStr);

    const tiktokStmt = context.env.DB.prepare(
      'SELECT * FROM tiktok_daily_metrics WHERE client_id = ? AND date >= ? ORDER BY date DESC'
    ).bind(targetClientId, cutoffStr);

    const [metaResult, googleResult, tiktokResult] = await context.env.DB.batch([
      metaStmt,
      googleStmt,
      tiktokStmt
    ]);

    return new Response(
      JSON.stringify({
        meta: metaResult.results || [],
        google: googleResult.results || [],
        tiktok: tiktokResult.results || []
      }),
      {
        headers: { 'Content-Type': 'application/json' }
      }
    );
  } catch (error: any) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};
