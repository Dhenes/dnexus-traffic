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
    let targetClientId = url.searchParams.get('clientId');

    // Clientes comuns só podem ver suas próprias credenciais (ou das empresas que têm acesso)
    if (authUser.role !== 'admin') {
      if (!targetClientId) {
        return new Response(JSON.stringify({ error: 'clientId é obrigatório' }), {
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

    if (!targetClientId) {
      return new Response(JSON.stringify({ error: 'clientId é obrigatório' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const { results } = await context.env.DB.prepare(
      'SELECT id, platform, account_id, credentials_json, status, updated_at FROM ad_credentials WHERE client_id = ?'
    ).bind(targetClientId).all();

    // Reconstruct the credentials object for the frontend
    const credentialsResponse = {
      meta: { appId: '', appSecret: '', accessToken: '', accountId: '' },
      google: { devToken: '', clientId: '', clientSecret: '', refreshToken: '', customerId: '' },
      tiktok: { appId: '', secret: '', accessToken: '', advertiserId: '' }
    };

    results.forEach((row: any) => {
      try {
        const platform = row.platform as 'meta' | 'google' | 'tiktok';
        const parsed = JSON.parse(row.credentials_json);
        if (platform === 'meta') {
          credentialsResponse.meta = {
            appId: parsed.appId || '',
            appSecret: parsed.appSecret ? '••••••••' : '', // mask for security
            accessToken: parsed.accessToken ? '••••••••' : '',
            accountId: row.account_id || ''
          };
        } else if (platform === 'google') {
          credentialsResponse.google = {
            devToken: parsed.devToken ? '••••••••' : '',
            clientId: parsed.clientId || '',
            clientSecret: parsed.clientSecret ? '••••••••' : '',
            refreshToken: parsed.refreshToken ? '••••••••' : '',
            customerId: row.account_id || ''
          };
        } else if (platform === 'tiktok') {
          credentialsResponse.tiktok = {
            appId: parsed.appId || '',
            secret: parsed.secret ? '••••••••' : '',
            accessToken: parsed.accessToken ? '••••••••' : '',
            advertiserId: row.account_id || ''
          };
        }
      } catch (e) {
        console.error('Failed to parse credential json for row', row.id, e);
      }
    });

    return new Response(JSON.stringify(credentialsResponse), {
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

    // Apenas admins podem configurar/alterar chaves de API
    if (!authUser || authUser.role !== 'admin') {
      return new Response(JSON.stringify({ error: 'Acesso negado. Apenas administradores podem gerenciar conexões.' }), {
        status: 403,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const body: any = await context.request.json();
    const { platform, data, clientId } = body;

    if (!platform || !data || !clientId) {
      return new Response(JSON.stringify({ error: 'Faltam campos obrigatórios (platform, data ou clientId)' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    let accountId = '';
    if (platform === 'meta') accountId = data.accountId;
    if (platform === 'google') accountId = data.customerId;
    if (platform === 'tiktok') accountId = data.advertiserId;

    const credentialsJson = JSON.stringify(data);
    const id = `${clientId}_${platform}`;
    const updatedAt = Date.now();
    const status = 'active';

    await context.env.DB.prepare(`
      INSERT INTO ad_credentials (id, client_id, platform, account_id, credentials_json, status, updated_at)
      VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7)
      ON CONFLICT(id) DO UPDATE SET
        account_id = ?4,
        credentials_json = ?5,
        status = ?6,
        updated_at = ?7
    `).bind(id, clientId, platform, accountId, credentialsJson, status, updatedAt).run();

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
