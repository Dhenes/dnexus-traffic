import { getAuthUser } from './utils/auth';

interface Env {
  DB: D1Database;
  JWT_SECRET?: string;
}

const DEFAULT_SECRET = 'dnexus_super_secret_key_2026';

const getActionValue = (actions: any[] | undefined, types: string[]): number => {
  if (!actions || !Array.isArray(actions)) return 0;
  return actions
    .filter(act => types.includes(act.action_type))
    .reduce((sum, act) => sum + parseInt(act.value || '0', 10), 0);
};

const getActionFloatValue = (actions: any[] | undefined, types: string[]): number => {
  if (!actions || !Array.isArray(actions)) return 0.0;
  return actions
    .filter(act => types.includes(act.action_type))
    .reduce((sum, act) => sum + parseFloat(act.value || '0.0'), 0.0);
};

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
      if (!targetClientId) {
        return new Response(JSON.stringify({ error: 'Nenhum cliente selecionado para sincronização' }), {
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
        `?fields=campaign_id,campaign_name,reach,impressions,clicks,spend,actions,` +
        `video_play_actions,video_avg_time_watched_actions,video_thruplay_watched_actions,` +
        `video_p25_watched_actions,video_p50_watched_actions,video_p75_watched_actions,` +
        `video_p95_watched_actions,video_p100_watched_actions` +
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

        // Métricas extras solicitadas
        const landingPageViews = getActionValue(item.actions, ['landing_page_view']);
        const videoViews = getActionValue(item.video_play_actions, ['video_play']) || getActionValue(item.actions, ['video_play', 'video_view']);
        const videoPlayTime = getActionFloatValue(item.video_avg_time_watched_actions, ['video_play']);
        const thruplays = getActionValue(item.video_thruplay_watched_actions, ['video_play']);
        const videoP25 = getActionValue(item.video_p25_watched_actions, ['video_play']);
        const videoP50 = getActionValue(item.video_p50_watched_actions, ['video_play']);
        const videoP75 = getActionValue(item.video_p75_watched_actions, ['video_play']);
        const videoP95 = getActionValue(item.video_p95_watched_actions, ['video_play']);
        const videoP100 = getActionValue(item.video_p100_watched_actions, ['video_play']);
        const likes = getActionValue(item.actions, ['post_reaction']);
        const comments = getActionValue(item.actions, ['comment']);
        const saves = getActionValue(item.actions, ['post_save', 'onsite_conversion.post_save']);
        const shares = getActionValue(item.actions, ['post_share', 'share', 'onsite_conversion.post_share']);
        const instagramFollowers = getActionValue(item.actions, ['instagram_profile_follows']);

        const id = `${targetClientId}_meta_${campaignId}_${dateStr}`;
        
        batchStatements.push(
          context.env.DB.prepare(`
            INSERT INTO meta_daily_metrics (
              id, client_id, date, campaign_id, campaign_name, reach, impressions, clicks, spend, conversions_actions, 
              landing_page_views, video_views, video_play_time, thruplays, 
              video_p25_views, video_p50_views, video_p75_views, video_p95_views, video_p100_views, 
              likes, comments, saves, shares, instagram_followers, updated_at
            )
            VALUES (
              ?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9, ?10, 
              ?11, ?12, ?13, ?14, 
              ?15, ?16, ?17, ?18, ?19, 
              ?20, ?21, ?22, ?23, ?24, ?25
            )
            ON CONFLICT(id) DO UPDATE SET
              campaign_name = ?5,
              reach = ?6,
              impressions = ?7,
              clicks = ?8,
              spend = ?9,
              conversions_actions = ?10,
              landing_page_views = ?11,
              video_views = ?12,
              video_play_time = ?13,
              thruplays = ?14,
              video_p25_views = ?15,
              video_p50_views = ?16,
              video_p75_views = ?17,
              video_p95_views = ?18,
              video_p100_views = ?19,
              likes = ?20,
              comments = ?21,
              saves = ?22,
              shares = ?23,
              instagram_followers = ?24,
              updated_at = ?25
          `).bind(
            id, targetClientId, dateStr, campaignId, campaignName, reach, impressions, clicks, spend, conversions,
            landingPageViews, videoViews, videoPlayTime, thruplays,
            videoP25, videoP50, videoP75, videoP95, videoP100,
            likes, comments, saves, shares, instagramFollowers, timestamp
          )
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
