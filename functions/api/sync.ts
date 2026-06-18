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

    const platform = url.searchParams.get('platform'); // 'meta', 'google', 'tiktok' or null/all
    const timestamp = Date.now();
    const oneHour = 3600000;

    // Determine platforms to sync
    const platformsToSync: string[] = [];
    if (platform === 'meta') {
      platformsToSync.push('meta');
    } else if (platform === 'google') {
      platformsToSync.push('google');
    } else if (platform === 'tiktok') {
      platformsToSync.push('tiktok');
    } else {
      platformsToSync.push('meta', 'google', 'tiktok');
    }

    // Check rate limit for target platforms
    const skippedPlatforms: string[] = [];
    const activeSyncPlatforms: string[] = [];

    for (const p of platformsToSync) {
      if (authUser.role === 'client') {
        const lastSyncRow: any = await context.env.DB.prepare(
          'SELECT updated_at FROM last_syncs WHERE client_id = ? AND platform = ?'
        ).bind(targetClientId, p).first();
        
        if (lastSyncRow && (timestamp - lastSyncRow.updated_at) < oneHour) {
          if (platform === p) {
            const minutesLeft = Math.ceil((oneHour - (timestamp - lastSyncRow.updated_at)) / 60000);
            return new Response(JSON.stringify({ error: `Por favor, aguarde mais ${minutesLeft} minutos para atualizar esta plataforma.` }), {
              status: 429,
              headers: { 'Content-Type': 'application/json' }
            });
          }
          skippedPlatforms.push(p);
          continue;
        }
      }
      activeSyncPlatforms.push(p);
    }

    if (activeSyncPlatforms.length === 0 && platformsToSync.length > 0) {
      return new Response(JSON.stringify({ error: 'Todas as plataformas já foram atualizadas há menos de uma hora.' }), {
        status: 429,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const batchStatements: D1PreparedStatement[] = [];

    // 1. SYNC META
    let metaSyncSummary = '';
    if (activeSyncPlatforms.includes('meta')) {
      const metaCredRow: any = await context.env.DB.prepare(
        'SELECT credentials_json, account_id FROM ad_credentials WHERE client_id = ? AND platform = ?'
      ).bind(targetClientId, 'meta').first();

      let metaCredentialsValid = false;
      let parsedMetaCreds: any = null;

      if (metaCredRow) {
        try {
          parsedMetaCreds = JSON.parse(metaCredRow.credentials_json);
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

      if (metaCredentialsValid && parsedMetaCreds) {
        const { accessToken, accountId } = parsedMetaCreds;
        const actId = accountId.startsWith('act_') ? accountId : `act_${accountId}`;
        
        const metaApiUrl = `https://graph.facebook.com/v19.0/${actId}/insights` +
          `?fields=campaign_id,campaign_name,ad_id,ad_name,adset_name,reach,impressions,clicks,spend,actions,action_values,` +
          `video_play_actions,video_thruplay_watched_actions,` +
          `video_continuous_2_sec_watched_actions,` +
          `video_p25_watched_actions,video_p50_watched_actions,video_p75_watched_actions,` +
          `video_p95_watched_actions,video_p100_watched_actions` +
          `&level=ad` +
          `&time_increment=1` +
          `&date_preset=last_30d` +
          `&limit=500` +
          `&access_token=${accessToken}`;

        const metaRes = await fetch(metaApiUrl);
        
        if (!metaRes.ok) {
          const errData: any = await metaRes.json();
          throw new Error(`Erro na API do Meta Ads: ${errData.error?.message || metaRes.statusText}`);
        }

        const metaData: any = await metaRes.json();
        const insights = metaData.data || [];

        // Coletar todos os ad_ids únicos retornados nos insights
        const adIds = Array.from(new Set(insights.map((item: any) => item.ad_id).filter(Boolean))) as string[];
        const adDetailsMap: { [adId: string]: { previewUrl: string; thumbnailUrl: string } } = {};

        // Fazer chamada secundária em lotes para recuperar links de prévia e imagens
        if (adIds.length > 0) {
          const chunkSize = 40;
          for (let i = 0; i < adIds.length; i += chunkSize) {
            const chunk = adIds.slice(i, i + chunkSize);
            const idsQuery = chunk.join(',');
            const detailsUrl = `https://graph.facebook.com/v19.0/?ids=${idsQuery}&fields=preview_shareable_link,creative{id,thumbnail_url,image_url}&access_token=${accessToken}`;
            
            try {
              const detailsRes = await fetch(detailsUrl);
              if (detailsRes.ok) {
                const detailsData: any = await detailsRes.json();
                chunk.forEach((adId) => {
                  const adObj = detailsData[adId];
                  if (adObj) {
                    const previewUrl = adObj.preview_shareable_link || '';
                    const thumbnailUrl = adObj.creative?.thumbnail_url || adObj.creative?.image_url || '';
                    adDetailsMap[adId] = { previewUrl, thumbnailUrl };
                  }
                });
              } else {
                console.error(`Erro ao buscar mídias dos anúncios da Meta: ${detailsRes.statusText}`);
              }
            } catch (err) {
              console.error('Erro na chamada secundária de mídias dos anúncios da Meta', err);
            }
          }
        }

        insights.forEach((item: any) => {
          const dateStr = item.date_start;
          const adId = item.ad_id || '';
          const adName = item.ad_name || '';
          const adsetName = item.adset_name || '';
          const campaignId = item.campaign_id;
          const campaignName = item.campaign_name;
          const reach = parseInt(item.reach || '0', 10);
          const impressions = parseInt(item.impressions || '0', 10);
          const clicks = parseInt(item.clicks || '0', 10);
          const spend = parseFloat(item.spend || '0.0');

          const landingPageViews = getActionValue(item.actions, ['landing_page_view']);
          const videoViews = getActionValue(item.video_play_actions, ['video_play', 'video_view']) || getActionValue(item.actions, ['video_play', 'video_view']);
          const thruplays = getActionValue(item.video_thruplay_watched_actions, ['video_play', 'video_view']);
          const videoP25 = getActionValue(item.video_p25_watched_actions, ['video_play', 'video_view']);
          const videoP50 = getActionValue(item.video_p50_watched_actions, ['video_play', 'video_view']);
          const videoP75 = getActionValue(item.video_p75_watched_actions, ['video_play', 'video_view']);
          const videoP95 = getActionValue(item.video_p95_watched_actions, ['video_play', 'video_view']);
          const videoP100 = getActionValue(item.video_p100_watched_actions, ['video_play', 'video_view']);
          const likes = getActionValue(item.actions, ['post_reaction']);
          const comments = getActionValue(item.actions, ['comment']);
          const saves = getActionValue(item.actions, ['post_save', 'onsite_conversion.post_save']);
          const shares = getActionValue(item.actions, ['post_share', 'share', 'onsite_conversion.post_share']);
          const instagramFollowers = getActionValue(item.actions, [
            'instagram_profile_follows',
            'onsite_conversion.instagram_profile_follows',
            'instagram_profile_followers',
            'onsite_conversion.instagram_profile_followers',
            'instagram_follows',
            'onsite_conversion.instagram_follows'
          ]);

          const linkClicks = getActionValue(item.actions, ['link_click']);
          const checkoutsInitiated = getActionValue(item.actions, ['initiate_checkout']);
          const leads = getActionValue(item.actions, ['lead']);
          const newMessagingConnections = getActionValue(item.actions, ['new_thread']);
          const purchases = getActionValue(item.actions, ['purchase']);
          const purchasesConversionValue = getActionFloatValue(item.action_values, ['purchase']);
          const videoPlays = getActionValue(item.video_play_actions, ['video_play', 'video_view']);
          const video3SecViews = getActionValue(item.actions, ['video_view']);
          const video2SecContinuousViews = getActionValue(item.video_continuous_2_sec_watched_actions, ['video_play', 'video_view']);
          const video15SecViews = thruplays;

          // Obter mídias do mapa auxiliar
          const adMedia = adDetailsMap[adId] || { previewUrl: '', thumbnailUrl: '' };
          const adPreviewUrl = adMedia.previewUrl;
          const adThumbnailUrl = adMedia.thumbnailUrl;

          const id = `${targetClientId}_meta_${adId}_${dateStr}`;
          
          batchStatements.push(
            context.env.DB.prepare(`
              INSERT INTO meta_daily_metrics (
                id, client_id, date, campaign_id, campaign_name, ad_id, ad_name, adset_name, reach, impressions, clicks, spend, 
                landing_page_views, video_views, thruplays, 
                video_p25_views, video_p50_views, video_p75_views, video_p95_views, video_p100_views, 
                likes, comments, saves, shares, instagram_followers, 
                link_clicks, checkouts_initiated, leads, new_messaging_connections, purchases, purchases_conversion_value, 
                video_plays, video_3_sec_views, video_2_sec_continuous_views, video_15_sec_views, 
                ad_preview_url, ad_thumbnail_url, updated_at
              )
              VALUES (
                ?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9, ?10, 
                ?11, ?12, ?13, ?14, ?15, 
                ?16, ?17, ?18, ?19, ?20, 
                ?21, ?22, ?23, ?24, ?25, 
                ?26, ?27, ?28, ?29, ?30, ?31, 
                ?32, ?33, ?34, ?35, 
                ?36, ?37, ?38
              )
              ON CONFLICT(id) DO UPDATE SET
                campaign_name = ?5,
                ad_name = ?7,
                adset_name = ?8,
                reach = ?9,
                impressions = ?10,
                clicks = ?11,
                spend = ?12,
                landing_page_views = ?13,
                video_views = ?14,
                thruplays = ?15,
                video_p25_views = ?16,
                video_p50_views = ?17,
                video_p75_views = ?18,
                video_p95_views = ?19,
                video_p100_views = ?20,
                likes = ?21,
                comments = ?22,
                saves = ?23,
                shares = ?24,
                instagram_followers = ?25,
                link_clicks = ?26,
                checkouts_initiated = ?27,
                leads = ?28,
                new_messaging_connections = ?29,
                purchases = ?30,
                purchases_conversion_value = ?31,
                video_plays = ?32,
                video_3_sec_views = ?33,
                video_2_sec_continuous_views = ?34,
                video_15_sec_views = ?35,
                ad_preview_url = ?36,
                ad_thumbnail_url = ?37,
                updated_at = ?38
            `).bind(
              id, targetClientId, dateStr, campaignId, campaignName, adId, adName, adsetName, reach, impressions, clicks, spend,
              landingPageViews, videoViews, thruplays,
              videoP25, videoP50, videoP75, videoP95, videoP100,
              likes, comments, saves, shares, instagramFollowers,
              linkClicks, checkoutsInitiated, leads, newMessagingConnections, purchases, purchasesConversionValue,
              videoPlays, video3SecViews, video2SecContinuousViews, video15SecViews,
              adPreviewUrl, adThumbnailUrl, timestamp
            )
          );
        });

        // Registrar timestamp de última sincronização
        batchStatements.push(
          context.env.DB.prepare(
            'INSERT OR REPLACE INTO last_syncs (client_id, platform, updated_at) VALUES (?, ?, ?)'
          ).bind(targetClientId, 'meta', timestamp)
        );

        metaSyncSummary = `Meta Ads: ${insights.length} registros reais importados.`;
      } else {
        metaSyncSummary = 'Meta Ads: Não configurado.';
      }
    } else {
      metaSyncSummary = skippedPlatforms.includes('meta') 
        ? 'Meta Ads: Aguardando intervalo de 1 hora.' 
        : 'Meta Ads: Ignorado.';
    }

    // 2. CHECK GOOGLE & TIKTOK STATUS (INTEGRAÇÕES FUTURAS)
    let googleSyncSummary = '';
    let tiktokSyncSummary = '';

    if (activeSyncPlatforms.includes('google')) {
      const googleCredRow: any = await context.env.DB.prepare(
        'SELECT status FROM ad_credentials WHERE client_id = ? AND platform = ?'
      ).bind(targetClientId, 'google').first();
      if (googleCredRow) {
        googleSyncSummary = 'Google Ads: Conectado (integração futura).';
        batchStatements.push(
          context.env.DB.prepare(
            'INSERT OR REPLACE INTO last_syncs (client_id, platform, updated_at) VALUES (?, ?, ?)'
          ).bind(targetClientId, 'google', timestamp)
        );
      } else {
        googleSyncSummary = 'Google Ads: Não configurado.';
      }
    } else {
      googleSyncSummary = skippedPlatforms.includes('google')
        ? 'Google Ads: Aguardando intervalo de 1 hora.'
        : 'Google Ads: Ignorado.';
    }

    if (activeSyncPlatforms.includes('tiktok')) {
      const tiktokCredRow: any = await context.env.DB.prepare(
        'SELECT status FROM ad_credentials WHERE client_id = ? AND platform = ?'
      ).bind(targetClientId, 'tiktok').first();
      if (tiktokCredRow) {
        tiktokSyncSummary = 'TikTok Ads: Conectado (integração futura).';
        batchStatements.push(
          context.env.DB.prepare(
            'INSERT OR REPLACE INTO last_syncs (client_id, platform, updated_at) VALUES (?, ?, ?)'
          ).bind(targetClientId, 'tiktok', timestamp)
        );
      } else {
        tiktokSyncSummary = 'TikTok Ads: Não configurado.';
      }
    } else {
      tiktokSyncSummary = skippedPlatforms.includes('tiktok')
        ? 'TikTok Ads: Aguardando intervalo de 1 hora.'
        : 'TikTok Ads: Ignorado.';
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
