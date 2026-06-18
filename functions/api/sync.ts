import { getAuthUser } from './utils/auth';

interface Env {
  DB: D1Database;
  JWT_SECRET?: string;
}

const DEFAULT_SECRET = 'dnexus_super_secret_key_2026';

export const onRequestPost: PagesFunction<Env> = async (context) => {
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

    if (authUser.role !== 'admin') {
      targetClientId = authUser.clientId;
    }

    if (!targetClientId) {
      return new Response(JSON.stringify({ error: 'Nenhum cliente selecionado para sincronização' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const timestamp = Date.now();
    const batchStatements: D1PreparedStatement[] = [];

    // 1. VERIFICAR SE EXISTEM CREDENCIAIS REAIS DO META ADS SALVAS NO D1
    const metaCredRow: any = await context.env.DB.prepare(
      'SELECT credentials_json, account_id FROM ad_credentials WHERE client_id = ? AND platform = ?'
    ).bind(targetClientId, 'meta').first();

    let metaSyncSummary = '';
    let metaCredentialsValid = false;
    let parsedMetaCreds: any = null;

    if (metaCredRow) {
      try {
        parsedMetaCreds = JSON.parse(metaCredRow.credentials_json);
        // Verificar se os campos necessários existem e não são apenas as máscaras de exibição
        if (
          parsedMetaCreds.accountId && 
          parsedMetaCreds.accessToken && 
          parsedMetaCreds.accessToken !== '••••••••'
        ) {
          metaCredentialsValid = true;
        }
      } catch (e) {
        console.error('Failed to parse Meta credentials', e);
      }
    }

    // 2. SE FOR VÁLIDO, FAZER A INTEGRAÇÃO COM A API DO META ADS
    if (metaCredentialsValid && parsedMetaCreds) {
      const { accessToken, accountId } = parsedMetaCreds;
      const actId = accountId.startsWith('act_') ? accountId : `act_${accountId}`;
      
      // Chamada à API Graph do Meta Ads (Insights de Campanha, agrupados diariamente nos últimos 30 dias)
      const metaApiUrl = `https://graph.facebook.com/v19.0/${actId}/insights` +
        `?fields=campaign_id,campaign_name,reach,impressions,clicks,spend,actions` +
        `&level=campaign` +
        `&time_increment=1` +
        `&date_preset=last_30d` +
        `&access_token=${accessToken}`;

      const metaRes = await fetch(metaApiUrl);
      
      if (!metaRes.ok) {
        const errData: any = await metaRes.json();
        throw new Error(`Erro na API do Meta Ads: ${errData.error?.message || metaRes.statusText}`);
      }

      const metaData: any = await metaRes.json();
      const insights = metaData.data || [];

      insights.forEach((item: any) => {
        const dateStr = item.date_start; // Formato YYYY-MM-DD
        const campaignId = item.campaign_id;
        const campaignName = item.campaign_name;
        const reach = parseInt(item.reach || '0', 10);
        const impressions = parseInt(item.impressions || '0', 10);
        const clicks = parseInt(item.clicks || '0', 10);
        const spend = parseFloat(item.spend || '0.0');
        
        // Calcular conversões filtrando ações principais (purchase, lead, etc.)
        let conversions = 0;
        if (item.actions && Array.isArray(item.actions)) {
          const conversionTypes = ['purchase', 'lead', 'complete_registration', 'onsite_conversion', 'submit_application'];
          item.actions.forEach((act: any) => {
            const isConv = conversionTypes.some(type => act.action_type.includes(type));
            if (isConv) {
              conversions += parseInt(act.value || '0', 10);
            }
          });
          // Se não encontrou nenhuma das principais mas possui ações gerais, usa a soma geral como fallback
          if (conversions === 0) {
            conversions = item.actions.reduce((acc: number, act: any) => acc + parseInt(act.value || '0', 10), 0);
          }
        }

        const id = `${targetClientId}_meta_${campaignId}_${dateStr}`;
        
        batchStatements.push(
          context.env.DB.prepare(`
            INSERT INTO meta_daily_metrics (id, client_id, date, campaign_id, campaign_name, reach, impressions, clicks, spend, conversions_actions, updated_at)
            VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9, ?10, ?11)
            ON CONFLICT(id) DO UPDATE SET
              campaign_name = ?5,
              reach = ?6,
              impressions = ?7,
              clicks = ?8,
              spend = ?9,
              conversions_actions = ?10,
              updated_at = ?11
          `).bind(id, targetClientId, dateStr, campaignId, campaignName, reach, impressions, clicks, spend, conversions, timestamp)
        );
      });

      metaSyncSummary = `Meta Ads: ${insights.length} registros reais importados.`;
    } else {
      metaSyncSummary = 'Meta Ads: Não configurado.';
    }

    // 3. VERIFICAR STATUS DO GOOGLE ADS E TIKTOK ADS (INTEGRAÇÕES REAIS FUTURAS)
    let googleSyncSummary = 'Google Ads: Não configurado.';
    let tiktokSyncSummary = 'TikTok Ads: Não configurado.';

    const googleCredRow: any = await context.env.DB.prepare(
      'SELECT status FROM ad_credentials WHERE client_id = ? AND platform = ?'
    ).bind(targetClientId, 'google').first();
    if (googleCredRow) {
      googleSyncSummary = 'Google Ads: Conectado (integração futura).';
    }

    const tiktokCredRow: any = await context.env.DB.prepare(
      'SELECT status FROM ad_credentials WHERE client_id = ? AND platform = ?'
    ).bind(targetClientId, 'tiktok').first();
    if (tiktokCredRow) {
      tiktokSyncSummary = 'TikTok Ads: Conectado (integração futura).';
    }

    // Executar batch se houver statements
    if (batchStatements.length > 0) {
      await context.env.DB.batch(batchStatements);
    }

    return new Response(
      JSON.stringify({
        success: true,
        summary: `${metaSyncSummary} | ${googleSyncSummary} | ${tiktokSyncSummary}`
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
