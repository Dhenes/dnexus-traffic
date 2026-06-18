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
      // Fallback para simulação do Meta Ads se as credenciais reais não estiverem configuradas
      const scale = targetClientId === 'c_alfa' ? 1.6 : 0.8;
      const clientSuffix = targetClientId === 'c_alfa' ? 'Alfa' : 'Beta';
      const campaignsMeta = [
        { id: 'm_c1', name: `Meta_Conversão_Ebook_${clientSuffix}` },
        { id: 'm_c2', name: `Meta_Lookalike_Compradores_${clientSuffix}` },
        { id: 'm_c3', name: `Meta_Remarketing_Carrinho_${clientSuffix}` }
      ];

      for (let i = 29; i >= 0; i--) {
        const d = new Date();
        d.setDate(d.getDate() - i);
        const dateStr = d.toISOString().split('T')[0];

        campaignsMeta.forEach((c) => {
          const rand = (Math.sin(i * 0.5) * 0.2 + 1) * scale;
          const reach = Math.round((5000 + Math.random() * 2000) * rand);
          const impressions = Math.round(reach * (1.1 + Math.random() * 0.2));
          const clicks = Math.round(impressions * (0.015 + Math.random() * 0.01));
          const spend = parseFloat(((150 + Math.random() * 80) * rand).toFixed(2));
          const conversions = Math.round(clicks * (0.05 + Math.random() * 0.04));
          const id = `${targetClientId}_meta_${c.id}_${dateStr}`;

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
            `).bind(id, targetClientId, dateStr, c.id, c.name, reach, impressions, clicks, spend, conversions, timestamp)
          );
        });
      }
      metaSyncSummary = `Meta Ads: 90 registros simulados gerados.`;
    }

    // 3. FALLBACK PARA SIMULAÇÃO DO GOOGLE ADS E TIKTOK ADS (INTEGRAÇÕES REAIS FUTURAS)
    const scaleFactor = targetClientId === 'c_alfa' ? 1.8 : 0.8;
    const clientSuffix = targetClientId === 'c_alfa' ? 'Alfa' : 'Beta';

    const campaignsGoogle = [
      { id: 'g_c1', name: `Google_Pesquisa_Marca_${clientSuffix}` },
      { id: 'g_c2', name: `Google_PMax_Produtos_${clientSuffix}` },
      { id: 'g_c3', name: `Google_Display_${clientSuffix}` }
    ];

    const campaignsTiktok = [
      { id: 't_c1', name: `TikTok_Desafio30d_${clientSuffix}` },
      { id: 't_c2', name: `TikTok_Influenciadores_${clientSuffix}` }
    ];

    for (let i = 29; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const dateStr = d.toISOString().split('T')[0];

      // Google
      campaignsGoogle.forEach((c) => {
        const rand = (Math.cos(i * 0.4) * 0.25 + 1) * scaleFactor;
        const impressions = Math.round((8000 + Math.random() * 3000) * rand);
        const clicks = Math.round(impressions * (0.03 + Math.random() * 0.02));
        const cost = parseFloat(((200 + Math.random() * 120) * rand).toFixed(2));
        const conversions = parseFloat((clicks * (0.04 + Math.random() * 0.03)).toFixed(1));
        const conversions_value = parseFloat((conversions * (85 + Math.random() * 30)).toFixed(2));
        const id = `${targetClientId}_google_${c.id}_${dateStr}`;

        batchStatements.push(
          context.env.DB.prepare(`
            INSERT INTO google_daily_metrics (id, client_id, date, campaign_id, campaign_name, impressions, clicks, cost, conversions, conversions_value, updated_at)
            VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9, ?10, ?11)
            ON CONFLICT(id) DO UPDATE SET
              campaign_name = ?5,
              impressions = ?6,
              clicks = ?7,
              cost = ?8,
              conversions = ?9,
              conversions_value = ?10,
              updated_at = ?11
          `).bind(id, targetClientId, dateStr, c.id, c.name, impressions, clicks, cost, conversions, conversions_value, timestamp)
        );
      });

      // TikTok
      campaignsTiktok.forEach((c) => {
        const rand = (Math.sin(i * 0.6) * 0.3 + 1) * scaleFactor;
        const impressions = Math.round((12000 + Math.random() * 5000) * rand);
        const clicks = Math.round(impressions * (0.008 + Math.random() * 0.006));
        const spend = parseFloat(((100 + Math.random() * 50) * rand).toFixed(2));
        const conversion = Math.round(clicks * (0.03 + Math.random() * 0.03));
        const real_time_conversion = Math.round(conversion * (0.9 + Math.random() * 0.15));
        const id = `${targetClientId}_tiktok_${c.id}_${dateStr}`;

        batchStatements.push(
          context.env.DB.prepare(`
            INSERT INTO tiktok_daily_metrics (id, client_id, date, campaign_id, campaign_name, impressions, clicks, spend, conversion, real_time_conversion, updated_at)
            VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9, ?10, ?11)
            ON CONFLICT(id) DO UPDATE SET
              campaign_name = ?5,
              impressions = ?6,
              clicks = ?7,
              spend = ?8,
              conversion = ?9,
              real_time_conversion = ?10,
              updated_at = ?11
          `).bind(id, targetClientId, dateStr, c.id, c.name, impressions, clicks, spend, conversion, real_time_conversion, timestamp)
        );
      });
    }

    // Executar batch
    await context.env.DB.batch(batchStatements);

    return new Response(
      JSON.stringify({
        success: true,
        summary: `${metaSyncSummary} Google e TikTok Ads: simulados.`
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
