var __defProp = Object.defineProperty;
var __name = (target, value) => __defProp(target, "name", { value, configurable: true });

// .wrangler/tmp/pages-hSTovU/functionsWorker-0.8695546185825199.mjs
var __defProp2 = Object.defineProperty;
var __name2 = /* @__PURE__ */ __name((target, value) => __defProp2(target, "name", { value, configurable: true }), "__name");
function arrayBufferToBase64Url(buffer) {
  const bytes = new Uint8Array(buffer);
  let binary = "";
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}
__name(arrayBufferToBase64Url, "arrayBufferToBase64Url");
__name2(arrayBufferToBase64Url, "arrayBufferToBase64Url");
function base64UrlToArrayBuffer(base64Url) {
  const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/");
  const padLen = (4 - base64.length % 4) % 4;
  const padded = base64 + "=".repeat(padLen);
  const binary = atob(padded);
  const buffer = new ArrayBuffer(binary.length);
  const bytes = new Uint8Array(buffer);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return buffer;
}
__name(base64UrlToArrayBuffer, "base64UrlToArrayBuffer");
__name2(base64UrlToArrayBuffer, "base64UrlToArrayBuffer");
async function hashPassword(password) {
  const msgBuffer = new TextEncoder().encode(password);
  const hashBuffer = await crypto.subtle.digest("SHA-256", msgBuffer);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
}
__name(hashPassword, "hashPassword");
__name2(hashPassword, "hashPassword");
async function generateJWT(payload, secret) {
  const header = { alg: "HS256", typ: "JWT" };
  const headerStr = arrayBufferToBase64Url(new TextEncoder().encode(JSON.stringify(header)));
  const payloadStr = arrayBufferToBase64Url(new TextEncoder().encode(JSON.stringify(payload)));
  const tokenInput = `${headerStr}.${payloadStr}`;
  const encoder = new TextEncoder();
  const key = await crypto.subtle.importKey(
    "raw",
    encoder.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );
  const signatureBuffer = await crypto.subtle.sign(
    "HMAC",
    key,
    encoder.encode(tokenInput)
  );
  const signatureStr = arrayBufferToBase64Url(signatureBuffer);
  return `${tokenInput}.${signatureStr}`;
}
__name(generateJWT, "generateJWT");
__name2(generateJWT, "generateJWT");
async function verifyJWT(token, secret) {
  try {
    const parts = token.split(".");
    if (parts.length !== 3) return null;
    const [headerStr, payloadStr, signatureStr] = parts;
    const tokenInput = `${headerStr}.${payloadStr}`;
    const encoder = new TextEncoder();
    const key = await crypto.subtle.importKey(
      "raw",
      encoder.encode(secret),
      { name: "HMAC", hash: "SHA-256" },
      false,
      ["verify"]
    );
    const signatureBuffer = base64UrlToArrayBuffer(signatureStr);
    const isValid = await crypto.subtle.verify(
      "HMAC",
      key,
      signatureBuffer,
      encoder.encode(tokenInput)
    );
    if (!isValid) return null;
    const decodedPayload = atob(payloadStr.replace(/-/g, "+").replace(/_/g, "/"));
    return JSON.parse(decodedPayload);
  } catch (e) {
    return null;
  }
}
__name(verifyJWT, "verifyJWT");
__name2(verifyJWT, "verifyJWT");
async function getAuthUser(request, secret) {
  const authHeader = request.headers.get("Authorization");
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return null;
  }
  const token = authHeader.substring(7);
  return await verifyJWT(token, secret);
}
__name(getAuthUser, "getAuthUser");
__name2(getAuthUser, "getAuthUser");
var DEFAULT_SECRET = "dnexus_super_secret_key_2026";
var onRequestPost = /* @__PURE__ */ __name2(async (context) => {
  try {
    const body = await context.request.json();
    const { email, password } = body;
    if (!email || !password) {
      return new Response(JSON.stringify({ error: "E-mail e senha s\xE3o obrigat\xF3rios" }), {
        status: 400,
        headers: { "Content-Type": "application/json" }
      });
    }
    const secret = context.env.JWT_SECRET || DEFAULT_SECRET;
    const userRow = await context.env.DB.prepare(`
      SELECT u.id, u.email, u.password_hash, u.role, u.client_id, c.name as client_name
      FROM users u
      LEFT JOIN clients c ON u.client_id = c.id
      WHERE u.email = ?
    `).bind(email.toLowerCase().trim()).first();
    if (!userRow) {
      return new Response(JSON.stringify({ error: "Credenciais inv\xE1lidas" }), {
        status: 401,
        headers: { "Content-Type": "application/json" }
      });
    }
    const hashedInput = await hashPassword(password);
    if (hashedInput !== userRow.password_hash) {
      return new Response(JSON.stringify({ error: "Credenciais inv\xE1lidas" }), {
        status: 401,
        headers: { "Content-Type": "application/json" }
      });
    }
    const payload = {
      userId: userRow.id,
      role: userRow.role,
      clientId: userRow.client_id || ""
    };
    const token = await generateJWT(payload, secret);
    return new Response(JSON.stringify({
      token,
      user: {
        id: userRow.id,
        email: userRow.email,
        role: userRow.role,
        clientId: userRow.client_id || "",
        clientName: userRow.client_name || ""
      }
    }), {
      headers: { "Content-Type": "application/json" }
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { "Content-Type": "application/json" }
    });
  }
}, "onRequestPost");
var DEFAULT_SECRET2 = "dnexus_super_secret_key_2026";
var onRequestGet = /* @__PURE__ */ __name2(async (context) => {
  try {
    const secret = context.env.JWT_SECRET || DEFAULT_SECRET2;
    const authUser = await getAuthUser(context.request, secret);
    if (!authUser) {
      return new Response(JSON.stringify({ error: "N\xE3o autorizado" }), {
        status: 401,
        headers: { "Content-Type": "application/json" }
      });
    }
    const userRow = await context.env.DB.prepare(`
      SELECT u.id, u.email, u.role, u.client_id, c.name as client_name
      FROM users u
      LEFT JOIN clients c ON u.client_id = c.id
      WHERE u.id = ?
    `).bind(authUser.userId).first();
    if (!userRow) {
      return new Response(JSON.stringify({ error: "Usu\xE1rio n\xE3o encontrado" }), {
        status: 404,
        headers: { "Content-Type": "application/json" }
      });
    }
    return new Response(JSON.stringify({
      user: {
        id: userRow.id,
        email: userRow.email,
        role: userRow.role,
        clientId: userRow.client_id || "",
        clientName: userRow.client_name || ""
      }
    }), {
      headers: { "Content-Type": "application/json" }
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { "Content-Type": "application/json" }
    });
  }
}, "onRequestGet");
var DEFAULT_SECRET3 = "dnexus_super_secret_key_2026";
var onRequestGet2 = /* @__PURE__ */ __name2(async (context) => {
  try {
    const secret = context.env.JWT_SECRET || DEFAULT_SECRET3;
    const authUser = await getAuthUser(context.request, secret);
    if (!authUser || authUser.role !== "admin") {
      return new Response(JSON.stringify({ error: "Acesso negado" }), {
        status: 403,
        headers: { "Content-Type": "application/json" }
      });
    }
    const { results } = await context.env.DB.prepare(
      "SELECT id, name, created_at FROM clients ORDER BY name ASC"
    ).all();
    return new Response(JSON.stringify(results), {
      headers: { "Content-Type": "application/json" }
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { "Content-Type": "application/json" }
    });
  }
}, "onRequestGet");
var onRequestPost2 = /* @__PURE__ */ __name2(async (context) => {
  try {
    const secret = context.env.JWT_SECRET || DEFAULT_SECRET3;
    const authUser = await getAuthUser(context.request, secret);
    if (!authUser || authUser.role !== "admin") {
      return new Response(JSON.stringify({ error: "Acesso negado" }), {
        status: 403,
        headers: { "Content-Type": "application/json" }
      });
    }
    const body = await context.request.json();
    const { name } = body;
    if (!name || !name.trim()) {
      return new Response(JSON.stringify({ error: "Nome do cliente \xE9 obrigat\xF3rio" }), {
        status: 400,
        headers: { "Content-Type": "application/json" }
      });
    }
    const id = "c_" + Math.random().toString(36).substring(2, 8);
    const createdAt = Date.now();
    await context.env.DB.prepare(
      "INSERT INTO clients (id, name, created_at) VALUES (?, ?, ?)"
    ).bind(id, name.trim(), createdAt).run();
    return new Response(JSON.stringify({ success: true, client: { id, name, created_at: createdAt } }), {
      headers: { "Content-Type": "application/json" }
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { "Content-Type": "application/json" }
    });
  }
}, "onRequestPost");
var DEFAULT_SECRET4 = "dnexus_super_secret_key_2026";
var onRequestGet3 = /* @__PURE__ */ __name2(async (context) => {
  try {
    const secret = context.env.JWT_SECRET || DEFAULT_SECRET4;
    const authUser = await getAuthUser(context.request, secret);
    if (!authUser) {
      return new Response(JSON.stringify({ error: "N\xE3o autorizado" }), {
        status: 401,
        headers: { "Content-Type": "application/json" }
      });
    }
    const url = new URL(context.request.url);
    let targetClientId = url.searchParams.get("clientId");
    if (authUser.role !== "admin") {
      targetClientId = authUser.clientId;
    }
    if (!targetClientId) {
      return new Response(JSON.stringify({ error: "clientId \xE9 obrigat\xF3rio" }), {
        status: 400,
        headers: { "Content-Type": "application/json" }
      });
    }
    const { results } = await context.env.DB.prepare(
      "SELECT id, platform, account_id, credentials_json, status, updated_at FROM ad_credentials WHERE client_id = ?"
    ).bind(targetClientId).all();
    const credentialsResponse = {
      meta: { appId: "", appSecret: "", accessToken: "", accountId: "" },
      google: { devToken: "", clientId: "", clientSecret: "", refreshToken: "", customerId: "" },
      tiktok: { appId: "", secret: "", accessToken: "", advertiserId: "" }
    };
    results.forEach((row) => {
      try {
        const platform = row.platform;
        const parsed = JSON.parse(row.credentials_json);
        if (platform === "meta") {
          credentialsResponse.meta = {
            appId: parsed.appId || "",
            appSecret: parsed.appSecret ? "\u2022\u2022\u2022\u2022\u2022\u2022\u2022\u2022" : "",
            // mask for security
            accessToken: parsed.accessToken ? "\u2022\u2022\u2022\u2022\u2022\u2022\u2022\u2022" : "",
            accountId: row.account_id || ""
          };
        } else if (platform === "google") {
          credentialsResponse.google = {
            devToken: parsed.devToken ? "\u2022\u2022\u2022\u2022\u2022\u2022\u2022\u2022" : "",
            clientId: parsed.clientId || "",
            clientSecret: parsed.clientSecret ? "\u2022\u2022\u2022\u2022\u2022\u2022\u2022\u2022" : "",
            refreshToken: parsed.refreshToken ? "\u2022\u2022\u2022\u2022\u2022\u2022\u2022\u2022" : "",
            customerId: row.account_id || ""
          };
        } else if (platform === "tiktok") {
          credentialsResponse.tiktok = {
            appId: parsed.appId || "",
            secret: parsed.secret ? "\u2022\u2022\u2022\u2022\u2022\u2022\u2022\u2022" : "",
            accessToken: parsed.accessToken ? "\u2022\u2022\u2022\u2022\u2022\u2022\u2022\u2022" : "",
            advertiserId: row.account_id || ""
          };
        }
      } catch (e) {
        console.error("Failed to parse credential json for row", row.id, e);
      }
    });
    return new Response(JSON.stringify(credentialsResponse), {
      headers: { "Content-Type": "application/json" }
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { "Content-Type": "application/json" }
    });
  }
}, "onRequestGet");
var onRequestPost3 = /* @__PURE__ */ __name2(async (context) => {
  try {
    const secret = context.env.JWT_SECRET || DEFAULT_SECRET4;
    const authUser = await getAuthUser(context.request, secret);
    if (!authUser || authUser.role !== "admin") {
      return new Response(JSON.stringify({ error: "Acesso negado. Apenas administradores podem gerenciar conex\xF5es." }), {
        status: 403,
        headers: { "Content-Type": "application/json" }
      });
    }
    const body = await context.request.json();
    const { platform, data, clientId } = body;
    if (!platform || !data || !clientId) {
      return new Response(JSON.stringify({ error: "Faltam campos obrigat\xF3rios (platform, data ou clientId)" }), {
        status: 400,
        headers: { "Content-Type": "application/json" }
      });
    }
    let accountId = "";
    if (platform === "meta") accountId = data.accountId;
    if (platform === "google") accountId = data.customerId;
    if (platform === "tiktok") accountId = data.advertiserId;
    const credentialsJson = JSON.stringify(data);
    const id = `${clientId}_${platform}`;
    const updatedAt = Date.now();
    const status = "active";
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
      headers: { "Content-Type": "application/json" }
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { "Content-Type": "application/json" }
    });
  }
}, "onRequestPost");
var DEFAULT_SECRET5 = "dnexus_super_secret_key_2026";
var onRequestGet4 = /* @__PURE__ */ __name2(async (context) => {
  try {
    const secret = context.env.JWT_SECRET || DEFAULT_SECRET5;
    const authUser = await getAuthUser(context.request, secret);
    if (!authUser) {
      return new Response(JSON.stringify({ error: "N\xE3o autorizado" }), {
        status: 401,
        headers: { "Content-Type": "application/json" }
      });
    }
    const url = new URL(context.request.url);
    const range = url.searchParams.get("range") || "30d";
    let targetClientId = url.searchParams.get("clientId");
    if (authUser.role !== "admin") {
      targetClientId = authUser.clientId;
    }
    if (!targetClientId) {
      return new Response(
        JSON.stringify({ meta: [], google: [], tiktok: [] }),
        { headers: { "Content-Type": "application/json" } }
      );
    }
    const today = /* @__PURE__ */ new Date();
    let cutoffDate = /* @__PURE__ */ new Date();
    if (range === "7d") {
      cutoffDate.setDate(today.getDate() - 7);
    } else if (range === "30d") {
      cutoffDate.setDate(today.getDate() - 30);
    } else if (range === "this_month") {
      cutoffDate.setDate(1);
    } else {
      cutoffDate.setDate(today.getDate() - 30);
    }
    const cutoffStr = cutoffDate.toISOString().split("T")[0];
    const metaStmt = context.env.DB.prepare(
      "SELECT * FROM meta_daily_metrics WHERE client_id = ? AND date >= ? ORDER BY date DESC"
    ).bind(targetClientId, cutoffStr);
    const googleStmt = context.env.DB.prepare(
      "SELECT * FROM google_daily_metrics WHERE client_id = ? AND date >= ? ORDER BY date DESC"
    ).bind(targetClientId, cutoffStr);
    const tiktokStmt = context.env.DB.prepare(
      "SELECT * FROM tiktok_daily_metrics WHERE client_id = ? AND date >= ? ORDER BY date DESC"
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
        headers: { "Content-Type": "application/json" }
      }
    );
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { "Content-Type": "application/json" }
    });
  }
}, "onRequestGet");
var DEFAULT_SECRET6 = "dnexus_super_secret_key_2026";
var onRequestPost4 = /* @__PURE__ */ __name2(async (context) => {
  try {
    const secret = context.env.JWT_SECRET || DEFAULT_SECRET6;
    const authUser = await getAuthUser(context.request, secret);
    if (!authUser) {
      return new Response(JSON.stringify({ error: "N\xE3o autorizado" }), {
        status: 401,
        headers: { "Content-Type": "application/json" }
      });
    }
    const url = new URL(context.request.url);
    let targetClientId = url.searchParams.get("clientId");
    if (authUser.role !== "admin") {
      targetClientId = authUser.clientId;
    }
    if (!targetClientId) {
      return new Response(JSON.stringify({ error: "Nenhum cliente selecionado para sincroniza\xE7\xE3o" }), {
        status: 400,
        headers: { "Content-Type": "application/json" }
      });
    }
    const today = /* @__PURE__ */ new Date();
    const batchStatements = [];
    const timestamp = Date.now();
    const scaleFactor = targetClientId === "c_alfa" ? 1.8 : 0.8;
    const clientSuffix = targetClientId === "c_alfa" ? "Alfa" : "Beta";
    const campaignsMeta = [
      { id: "m_c1", name: `Meta_Convers\xE3o_Ebook_${clientSuffix}` },
      { id: "m_c2", name: `Meta_Lookalike_Compradores_${clientSuffix}` },
      { id: "m_c3", name: `Meta_Remarketing_Carrinho_${clientSuffix}` }
    ];
    const campaignsGoogle = [
      { id: "g_c1", name: `Google_Pesquisa_Marca_${clientSuffix}` },
      { id: "g_c2", name: `Google_PMax_Produtos_${clientSuffix}` },
      { id: "g_c3", name: `Google_Display_${clientSuffix}` }
    ];
    const campaignsTiktok = [
      { id: "t_c1", name: `TikTok_Desafio30d_${clientSuffix}` },
      { id: "t_c2", name: `TikTok_Influenciadores_${clientSuffix}` }
    ];
    for (let i = 29; i >= 0; i--) {
      const d = /* @__PURE__ */ new Date();
      d.setDate(d.getDate() - i);
      const dateStr = d.toISOString().split("T")[0];
      campaignsMeta.forEach((c) => {
        const rand = (Math.sin(i * 0.5) * 0.2 + 1) * scaleFactor;
        const reach = Math.round((5e3 + Math.random() * 2e3) * rand);
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
      campaignsGoogle.forEach((c) => {
        const rand = (Math.cos(i * 0.4) * 0.25 + 1) * scaleFactor;
        const impressions = Math.round((8e3 + Math.random() * 3e3) * rand);
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
      campaignsTiktok.forEach((c) => {
        const rand = (Math.sin(i * 0.6) * 0.3 + 1) * scaleFactor;
        const impressions = Math.round((12e3 + Math.random() * 5e3) * rand);
        const clicks = Math.round(impressions * (8e-3 + Math.random() * 6e-3));
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
    await context.env.DB.batch(batchStatements);
    return new Response(
      JSON.stringify({
        success: true,
        summary: `30 dias de m\xE9tricas geradas para ${clientSuffix} no banco D1.`
      }),
      {
        headers: { "Content-Type": "application/json" }
      }
    );
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { "Content-Type": "application/json" }
    });
  }
}, "onRequestPost");
var DEFAULT_SECRET7 = "dnexus_super_secret_key_2026";
var onRequestGet5 = /* @__PURE__ */ __name2(async (context) => {
  try {
    const secret = context.env.JWT_SECRET || DEFAULT_SECRET7;
    const authUser = await getAuthUser(context.request, secret);
    if (!authUser || authUser.role !== "admin") {
      return new Response(JSON.stringify({ error: "Acesso negado" }), {
        status: 403,
        headers: { "Content-Type": "application/json" }
      });
    }
    const { results } = await context.env.DB.prepare(`
      SELECT u.id, u.email, u.role, u.client_id, u.created_at, c.name as client_name
      FROM users u
      LEFT JOIN clients c ON u.client_id = c.id
      ORDER BY u.created_at DESC
    `).all();
    return new Response(JSON.stringify(results), {
      headers: { "Content-Type": "application/json" }
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { "Content-Type": "application/json" }
    });
  }
}, "onRequestGet");
var onRequestPost5 = /* @__PURE__ */ __name2(async (context) => {
  try {
    const secret = context.env.JWT_SECRET || DEFAULT_SECRET7;
    const authUser = await getAuthUser(context.request, secret);
    if (!authUser || authUser.role !== "admin") {
      return new Response(JSON.stringify({ error: "Acesso negado" }), {
        status: 403,
        headers: { "Content-Type": "application/json" }
      });
    }
    const body = await context.request.json();
    const { email, password, role, clientId } = body;
    if (!email || !password || !role) {
      return new Response(JSON.stringify({ error: "E-mail, senha e n\xEDvel de acesso s\xE3o obrigat\xF3rios" }), {
        status: 400,
        headers: { "Content-Type": "application/json" }
      });
    }
    if (role === "client" && !clientId) {
      return new Response(JSON.stringify({ error: "Clientes precisam estar associados a uma empresa" }), {
        status: 400,
        headers: { "Content-Type": "application/json" }
      });
    }
    const passwordHash = await hashPassword(password);
    const userId = "u_" + Math.random().toString(36).substring(2, 8);
    const createdAt = Date.now();
    await context.env.DB.prepare(`
      INSERT INTO users (id, email, password_hash, role, client_id, created_at)
      VALUES (?, ?, ?, ?, ?, ?)
    `).bind(
      userId,
      email.toLowerCase().trim(),
      passwordHash,
      role,
      role === "admin" ? null : clientId,
      createdAt
    ).run();
    return new Response(JSON.stringify({
      success: true,
      user: { id: userId, email, role, clientId, created_at: createdAt }
    }), {
      headers: { "Content-Type": "application/json" }
    });
  } catch (error) {
    if (error.message.includes("UNIQUE constraint failed")) {
      return new Response(JSON.stringify({ error: "Este endere\xE7o de e-mail j\xE1 est\xE1 em uso" }), {
        status: 400,
        headers: { "Content-Type": "application/json" }
      });
    }
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { "Content-Type": "application/json" }
    });
  }
}, "onRequestPost");
var routes = [
  {
    routePath: "/api/auth/login",
    mountPath: "/api/auth",
    method: "POST",
    middlewares: [],
    modules: [onRequestPost]
  },
  {
    routePath: "/api/auth/me",
    mountPath: "/api/auth",
    method: "GET",
    middlewares: [],
    modules: [onRequestGet]
  },
  {
    routePath: "/api/clients",
    mountPath: "/api",
    method: "GET",
    middlewares: [],
    modules: [onRequestGet2]
  },
  {
    routePath: "/api/clients",
    mountPath: "/api",
    method: "POST",
    middlewares: [],
    modules: [onRequestPost2]
  },
  {
    routePath: "/api/credentials",
    mountPath: "/api",
    method: "GET",
    middlewares: [],
    modules: [onRequestGet3]
  },
  {
    routePath: "/api/credentials",
    mountPath: "/api",
    method: "POST",
    middlewares: [],
    modules: [onRequestPost3]
  },
  {
    routePath: "/api/metrics",
    mountPath: "/api",
    method: "GET",
    middlewares: [],
    modules: [onRequestGet4]
  },
  {
    routePath: "/api/sync",
    mountPath: "/api",
    method: "POST",
    middlewares: [],
    modules: [onRequestPost4]
  },
  {
    routePath: "/api/users",
    mountPath: "/api",
    method: "GET",
    middlewares: [],
    modules: [onRequestGet5]
  },
  {
    routePath: "/api/users",
    mountPath: "/api",
    method: "POST",
    middlewares: [],
    modules: [onRequestPost5]
  }
];
function lexer(str) {
  var tokens = [];
  var i = 0;
  while (i < str.length) {
    var char = str[i];
    if (char === "*" || char === "+" || char === "?") {
      tokens.push({ type: "MODIFIER", index: i, value: str[i++] });
      continue;
    }
    if (char === "\\") {
      tokens.push({ type: "ESCAPED_CHAR", index: i++, value: str[i++] });
      continue;
    }
    if (char === "{") {
      tokens.push({ type: "OPEN", index: i, value: str[i++] });
      continue;
    }
    if (char === "}") {
      tokens.push({ type: "CLOSE", index: i, value: str[i++] });
      continue;
    }
    if (char === ":") {
      var name = "";
      var j = i + 1;
      while (j < str.length) {
        var code = str.charCodeAt(j);
        if (
          // `0-9`
          code >= 48 && code <= 57 || // `A-Z`
          code >= 65 && code <= 90 || // `a-z`
          code >= 97 && code <= 122 || // `_`
          code === 95
        ) {
          name += str[j++];
          continue;
        }
        break;
      }
      if (!name)
        throw new TypeError("Missing parameter name at ".concat(i));
      tokens.push({ type: "NAME", index: i, value: name });
      i = j;
      continue;
    }
    if (char === "(") {
      var count = 1;
      var pattern = "";
      var j = i + 1;
      if (str[j] === "?") {
        throw new TypeError('Pattern cannot start with "?" at '.concat(j));
      }
      while (j < str.length) {
        if (str[j] === "\\") {
          pattern += str[j++] + str[j++];
          continue;
        }
        if (str[j] === ")") {
          count--;
          if (count === 0) {
            j++;
            break;
          }
        } else if (str[j] === "(") {
          count++;
          if (str[j + 1] !== "?") {
            throw new TypeError("Capturing groups are not allowed at ".concat(j));
          }
        }
        pattern += str[j++];
      }
      if (count)
        throw new TypeError("Unbalanced pattern at ".concat(i));
      if (!pattern)
        throw new TypeError("Missing pattern at ".concat(i));
      tokens.push({ type: "PATTERN", index: i, value: pattern });
      i = j;
      continue;
    }
    tokens.push({ type: "CHAR", index: i, value: str[i++] });
  }
  tokens.push({ type: "END", index: i, value: "" });
  return tokens;
}
__name(lexer, "lexer");
__name2(lexer, "lexer");
function parse(str, options) {
  if (options === void 0) {
    options = {};
  }
  var tokens = lexer(str);
  var _a = options.prefixes, prefixes = _a === void 0 ? "./" : _a, _b = options.delimiter, delimiter = _b === void 0 ? "/#?" : _b;
  var result = [];
  var key = 0;
  var i = 0;
  var path = "";
  var tryConsume = /* @__PURE__ */ __name2(function(type) {
    if (i < tokens.length && tokens[i].type === type)
      return tokens[i++].value;
  }, "tryConsume");
  var mustConsume = /* @__PURE__ */ __name2(function(type) {
    var value2 = tryConsume(type);
    if (value2 !== void 0)
      return value2;
    var _a2 = tokens[i], nextType = _a2.type, index = _a2.index;
    throw new TypeError("Unexpected ".concat(nextType, " at ").concat(index, ", expected ").concat(type));
  }, "mustConsume");
  var consumeText = /* @__PURE__ */ __name2(function() {
    var result2 = "";
    var value2;
    while (value2 = tryConsume("CHAR") || tryConsume("ESCAPED_CHAR")) {
      result2 += value2;
    }
    return result2;
  }, "consumeText");
  var isSafe = /* @__PURE__ */ __name2(function(value2) {
    for (var _i = 0, delimiter_1 = delimiter; _i < delimiter_1.length; _i++) {
      var char2 = delimiter_1[_i];
      if (value2.indexOf(char2) > -1)
        return true;
    }
    return false;
  }, "isSafe");
  var safePattern = /* @__PURE__ */ __name2(function(prefix2) {
    var prev = result[result.length - 1];
    var prevText = prefix2 || (prev && typeof prev === "string" ? prev : "");
    if (prev && !prevText) {
      throw new TypeError('Must have text between two parameters, missing text after "'.concat(prev.name, '"'));
    }
    if (!prevText || isSafe(prevText))
      return "[^".concat(escapeString(delimiter), "]+?");
    return "(?:(?!".concat(escapeString(prevText), ")[^").concat(escapeString(delimiter), "])+?");
  }, "safePattern");
  while (i < tokens.length) {
    var char = tryConsume("CHAR");
    var name = tryConsume("NAME");
    var pattern = tryConsume("PATTERN");
    if (name || pattern) {
      var prefix = char || "";
      if (prefixes.indexOf(prefix) === -1) {
        path += prefix;
        prefix = "";
      }
      if (path) {
        result.push(path);
        path = "";
      }
      result.push({
        name: name || key++,
        prefix,
        suffix: "",
        pattern: pattern || safePattern(prefix),
        modifier: tryConsume("MODIFIER") || ""
      });
      continue;
    }
    var value = char || tryConsume("ESCAPED_CHAR");
    if (value) {
      path += value;
      continue;
    }
    if (path) {
      result.push(path);
      path = "";
    }
    var open = tryConsume("OPEN");
    if (open) {
      var prefix = consumeText();
      var name_1 = tryConsume("NAME") || "";
      var pattern_1 = tryConsume("PATTERN") || "";
      var suffix = consumeText();
      mustConsume("CLOSE");
      result.push({
        name: name_1 || (pattern_1 ? key++ : ""),
        pattern: name_1 && !pattern_1 ? safePattern(prefix) : pattern_1,
        prefix,
        suffix,
        modifier: tryConsume("MODIFIER") || ""
      });
      continue;
    }
    mustConsume("END");
  }
  return result;
}
__name(parse, "parse");
__name2(parse, "parse");
function match(str, options) {
  var keys = [];
  var re = pathToRegexp(str, keys, options);
  return regexpToFunction(re, keys, options);
}
__name(match, "match");
__name2(match, "match");
function regexpToFunction(re, keys, options) {
  if (options === void 0) {
    options = {};
  }
  var _a = options.decode, decode = _a === void 0 ? function(x) {
    return x;
  } : _a;
  return function(pathname) {
    var m = re.exec(pathname);
    if (!m)
      return false;
    var path = m[0], index = m.index;
    var params = /* @__PURE__ */ Object.create(null);
    var _loop_1 = /* @__PURE__ */ __name2(function(i2) {
      if (m[i2] === void 0)
        return "continue";
      var key = keys[i2 - 1];
      if (key.modifier === "*" || key.modifier === "+") {
        params[key.name] = m[i2].split(key.prefix + key.suffix).map(function(value) {
          return decode(value, key);
        });
      } else {
        params[key.name] = decode(m[i2], key);
      }
    }, "_loop_1");
    for (var i = 1; i < m.length; i++) {
      _loop_1(i);
    }
    return { path, index, params };
  };
}
__name(regexpToFunction, "regexpToFunction");
__name2(regexpToFunction, "regexpToFunction");
function escapeString(str) {
  return str.replace(/([.+*?=^!:${}()[\]|/\\])/g, "\\$1");
}
__name(escapeString, "escapeString");
__name2(escapeString, "escapeString");
function flags(options) {
  return options && options.sensitive ? "" : "i";
}
__name(flags, "flags");
__name2(flags, "flags");
function regexpToRegexp(path, keys) {
  if (!keys)
    return path;
  var groupsRegex = /\((?:\?<(.*?)>)?(?!\?)/g;
  var index = 0;
  var execResult = groupsRegex.exec(path.source);
  while (execResult) {
    keys.push({
      // Use parenthesized substring match if available, index otherwise
      name: execResult[1] || index++,
      prefix: "",
      suffix: "",
      modifier: "",
      pattern: ""
    });
    execResult = groupsRegex.exec(path.source);
  }
  return path;
}
__name(regexpToRegexp, "regexpToRegexp");
__name2(regexpToRegexp, "regexpToRegexp");
function arrayToRegexp(paths, keys, options) {
  var parts = paths.map(function(path) {
    return pathToRegexp(path, keys, options).source;
  });
  return new RegExp("(?:".concat(parts.join("|"), ")"), flags(options));
}
__name(arrayToRegexp, "arrayToRegexp");
__name2(arrayToRegexp, "arrayToRegexp");
function stringToRegexp(path, keys, options) {
  return tokensToRegexp(parse(path, options), keys, options);
}
__name(stringToRegexp, "stringToRegexp");
__name2(stringToRegexp, "stringToRegexp");
function tokensToRegexp(tokens, keys, options) {
  if (options === void 0) {
    options = {};
  }
  var _a = options.strict, strict = _a === void 0 ? false : _a, _b = options.start, start = _b === void 0 ? true : _b, _c = options.end, end = _c === void 0 ? true : _c, _d = options.encode, encode = _d === void 0 ? function(x) {
    return x;
  } : _d, _e = options.delimiter, delimiter = _e === void 0 ? "/#?" : _e, _f = options.endsWith, endsWith = _f === void 0 ? "" : _f;
  var endsWithRe = "[".concat(escapeString(endsWith), "]|$");
  var delimiterRe = "[".concat(escapeString(delimiter), "]");
  var route = start ? "^" : "";
  for (var _i = 0, tokens_1 = tokens; _i < tokens_1.length; _i++) {
    var token = tokens_1[_i];
    if (typeof token === "string") {
      route += escapeString(encode(token));
    } else {
      var prefix = escapeString(encode(token.prefix));
      var suffix = escapeString(encode(token.suffix));
      if (token.pattern) {
        if (keys)
          keys.push(token);
        if (prefix || suffix) {
          if (token.modifier === "+" || token.modifier === "*") {
            var mod = token.modifier === "*" ? "?" : "";
            route += "(?:".concat(prefix, "((?:").concat(token.pattern, ")(?:").concat(suffix).concat(prefix, "(?:").concat(token.pattern, "))*)").concat(suffix, ")").concat(mod);
          } else {
            route += "(?:".concat(prefix, "(").concat(token.pattern, ")").concat(suffix, ")").concat(token.modifier);
          }
        } else {
          if (token.modifier === "+" || token.modifier === "*") {
            throw new TypeError('Can not repeat "'.concat(token.name, '" without a prefix and suffix'));
          }
          route += "(".concat(token.pattern, ")").concat(token.modifier);
        }
      } else {
        route += "(?:".concat(prefix).concat(suffix, ")").concat(token.modifier);
      }
    }
  }
  if (end) {
    if (!strict)
      route += "".concat(delimiterRe, "?");
    route += !options.endsWith ? "$" : "(?=".concat(endsWithRe, ")");
  } else {
    var endToken = tokens[tokens.length - 1];
    var isEndDelimited = typeof endToken === "string" ? delimiterRe.indexOf(endToken[endToken.length - 1]) > -1 : endToken === void 0;
    if (!strict) {
      route += "(?:".concat(delimiterRe, "(?=").concat(endsWithRe, "))?");
    }
    if (!isEndDelimited) {
      route += "(?=".concat(delimiterRe, "|").concat(endsWithRe, ")");
    }
  }
  return new RegExp(route, flags(options));
}
__name(tokensToRegexp, "tokensToRegexp");
__name2(tokensToRegexp, "tokensToRegexp");
function pathToRegexp(path, keys, options) {
  if (path instanceof RegExp)
    return regexpToRegexp(path, keys);
  if (Array.isArray(path))
    return arrayToRegexp(path, keys, options);
  return stringToRegexp(path, keys, options);
}
__name(pathToRegexp, "pathToRegexp");
__name2(pathToRegexp, "pathToRegexp");
var escapeRegex = /[.+?^${}()|[\]\\]/g;
function* executeRequest(request) {
  const requestPath = new URL(request.url).pathname;
  for (const route of [...routes].reverse()) {
    if (route.method && route.method !== request.method) {
      continue;
    }
    const routeMatcher = match(route.routePath.replace(escapeRegex, "\\$&"), {
      end: false
    });
    const mountMatcher = match(route.mountPath.replace(escapeRegex, "\\$&"), {
      end: false
    });
    const matchResult = routeMatcher(requestPath);
    const mountMatchResult = mountMatcher(requestPath);
    if (matchResult && mountMatchResult) {
      for (const handler of route.middlewares.flat()) {
        yield {
          handler,
          params: matchResult.params,
          path: mountMatchResult.path
        };
      }
    }
  }
  for (const route of routes) {
    if (route.method && route.method !== request.method) {
      continue;
    }
    const routeMatcher = match(route.routePath.replace(escapeRegex, "\\$&"), {
      end: true
    });
    const mountMatcher = match(route.mountPath.replace(escapeRegex, "\\$&"), {
      end: false
    });
    const matchResult = routeMatcher(requestPath);
    const mountMatchResult = mountMatcher(requestPath);
    if (matchResult && mountMatchResult && route.modules.length) {
      for (const handler of route.modules.flat()) {
        yield {
          handler,
          params: matchResult.params,
          path: matchResult.path
        };
      }
      break;
    }
  }
}
__name(executeRequest, "executeRequest");
__name2(executeRequest, "executeRequest");
var pages_template_worker_default = {
  async fetch(originalRequest, env, workerContext) {
    let request = originalRequest;
    const handlerIterator = executeRequest(request);
    let data = {};
    let isFailOpen = false;
    const next = /* @__PURE__ */ __name2(async (input, init) => {
      if (input !== void 0) {
        let url = input;
        if (typeof input === "string") {
          url = new URL(input, request.url).toString();
        }
        request = new Request(url, init);
      }
      const result = handlerIterator.next();
      if (result.done === false) {
        const { handler, params, path } = result.value;
        const context = {
          request: new Request(request.clone()),
          functionPath: path,
          next,
          params,
          get data() {
            return data;
          },
          set data(value) {
            if (typeof value !== "object" || value === null) {
              throw new Error("context.data must be an object");
            }
            data = value;
          },
          env,
          waitUntil: workerContext.waitUntil.bind(workerContext),
          passThroughOnException: /* @__PURE__ */ __name2(() => {
            isFailOpen = true;
          }, "passThroughOnException")
        };
        const response = await handler(context);
        if (!(response instanceof Response)) {
          throw new Error("Your Pages function should return a Response");
        }
        return cloneResponse(response);
      } else if ("ASSETS") {
        const response = await env["ASSETS"].fetch(request);
        return cloneResponse(response);
      } else {
        const response = await fetch(request);
        return cloneResponse(response);
      }
    }, "next");
    try {
      return await next();
    } catch (error) {
      if (isFailOpen) {
        const response = await env["ASSETS"].fetch(request);
        return cloneResponse(response);
      }
      throw error;
    }
  }
};
var cloneResponse = /* @__PURE__ */ __name2((response) => (
  // https://fetch.spec.whatwg.org/#null-body-status
  new Response(
    [101, 204, 205, 304].includes(response.status) ? null : response.body,
    response
  )
), "cloneResponse");
var drainBody = /* @__PURE__ */ __name2(async (request, env, _ctx, middlewareCtx) => {
  try {
    return await middlewareCtx.next(request, env);
  } finally {
    try {
      if (request.body !== null && !request.bodyUsed) {
        const reader = request.body.getReader();
        while (!(await reader.read()).done) {
        }
      }
    } catch (e) {
      console.error("Failed to drain the unused request body.", e);
    }
  }
}, "drainBody");
var middleware_ensure_req_body_drained_default = drainBody;
function reduceError(e) {
  return {
    name: e?.name,
    message: e?.message ?? String(e),
    stack: e?.stack,
    cause: e?.cause === void 0 ? void 0 : reduceError(e.cause)
  };
}
__name(reduceError, "reduceError");
__name2(reduceError, "reduceError");
var jsonError = /* @__PURE__ */ __name2(async (request, env, _ctx, middlewareCtx) => {
  try {
    return await middlewareCtx.next(request, env);
  } catch (e) {
    const error = reduceError(e);
    return Response.json(error, {
      status: 500,
      headers: { "MF-Experimental-Error-Stack": "true" }
    });
  }
}, "jsonError");
var middleware_miniflare3_json_error_default = jsonError;
var __INTERNAL_WRANGLER_MIDDLEWARE__ = [
  middleware_ensure_req_body_drained_default,
  middleware_miniflare3_json_error_default
];
var middleware_insertion_facade_default = pages_template_worker_default;
var __facade_middleware__ = [];
function __facade_register__(...args) {
  __facade_middleware__.push(...args.flat());
}
__name(__facade_register__, "__facade_register__");
__name2(__facade_register__, "__facade_register__");
function __facade_invokeChain__(request, env, ctx, dispatch, middlewareChain) {
  const [head, ...tail] = middlewareChain;
  const middlewareCtx = {
    dispatch,
    next(newRequest, newEnv) {
      return __facade_invokeChain__(newRequest, newEnv, ctx, dispatch, tail);
    }
  };
  return head(request, env, ctx, middlewareCtx);
}
__name(__facade_invokeChain__, "__facade_invokeChain__");
__name2(__facade_invokeChain__, "__facade_invokeChain__");
function __facade_invoke__(request, env, ctx, dispatch, finalMiddleware) {
  return __facade_invokeChain__(request, env, ctx, dispatch, [
    ...__facade_middleware__,
    finalMiddleware
  ]);
}
__name(__facade_invoke__, "__facade_invoke__");
__name2(__facade_invoke__, "__facade_invoke__");
var __Facade_ScheduledController__ = class ___Facade_ScheduledController__ {
  static {
    __name(this, "___Facade_ScheduledController__");
  }
  constructor(scheduledTime, cron, noRetry) {
    this.scheduledTime = scheduledTime;
    this.cron = cron;
    this.#noRetry = noRetry;
  }
  static {
    __name2(this, "__Facade_ScheduledController__");
  }
  #noRetry;
  noRetry() {
    if (!(this instanceof ___Facade_ScheduledController__)) {
      throw new TypeError("Illegal invocation");
    }
    this.#noRetry();
  }
};
function wrapExportedHandler(worker) {
  if (__INTERNAL_WRANGLER_MIDDLEWARE__ === void 0 || __INTERNAL_WRANGLER_MIDDLEWARE__.length === 0) {
    return worker;
  }
  for (const middleware of __INTERNAL_WRANGLER_MIDDLEWARE__) {
    __facade_register__(middleware);
  }
  const fetchDispatcher = /* @__PURE__ */ __name2(function(request, env, ctx) {
    if (worker.fetch === void 0) {
      throw new Error("Handler does not export a fetch() function.");
    }
    return worker.fetch(request, env, ctx);
  }, "fetchDispatcher");
  return {
    ...worker,
    fetch(request, env, ctx) {
      const dispatcher = /* @__PURE__ */ __name2(function(type, init) {
        if (type === "scheduled" && worker.scheduled !== void 0) {
          const controller = new __Facade_ScheduledController__(
            Date.now(),
            init.cron ?? "",
            () => {
            }
          );
          return worker.scheduled(controller, env, ctx);
        }
      }, "dispatcher");
      return __facade_invoke__(request, env, ctx, dispatcher, fetchDispatcher);
    }
  };
}
__name(wrapExportedHandler, "wrapExportedHandler");
__name2(wrapExportedHandler, "wrapExportedHandler");
function wrapWorkerEntrypoint(klass) {
  if (__INTERNAL_WRANGLER_MIDDLEWARE__ === void 0 || __INTERNAL_WRANGLER_MIDDLEWARE__.length === 0) {
    return klass;
  }
  for (const middleware of __INTERNAL_WRANGLER_MIDDLEWARE__) {
    __facade_register__(middleware);
  }
  return class extends klass {
    #fetchDispatcher = /* @__PURE__ */ __name2((request, env, ctx) => {
      this.env = env;
      this.ctx = ctx;
      if (super.fetch === void 0) {
        throw new Error("Entrypoint class does not define a fetch() function.");
      }
      return super.fetch(request);
    }, "#fetchDispatcher");
    #dispatcher = /* @__PURE__ */ __name2((type, init) => {
      if (type === "scheduled" && super.scheduled !== void 0) {
        const controller = new __Facade_ScheduledController__(
          Date.now(),
          init.cron ?? "",
          () => {
          }
        );
        return super.scheduled(controller);
      }
    }, "#dispatcher");
    fetch(request) {
      return __facade_invoke__(
        request,
        this.env,
        this.ctx,
        this.#dispatcher,
        this.#fetchDispatcher
      );
    }
  };
}
__name(wrapWorkerEntrypoint, "wrapWorkerEntrypoint");
__name2(wrapWorkerEntrypoint, "wrapWorkerEntrypoint");
var WRAPPED_ENTRY;
if (typeof middleware_insertion_facade_default === "object") {
  WRAPPED_ENTRY = wrapExportedHandler(middleware_insertion_facade_default);
} else if (typeof middleware_insertion_facade_default === "function") {
  WRAPPED_ENTRY = wrapWorkerEntrypoint(middleware_insertion_facade_default);
}
var middleware_loader_entry_default = WRAPPED_ENTRY;

// node_modules/wrangler/templates/middleware/middleware-ensure-req-body-drained.ts
var drainBody2 = /* @__PURE__ */ __name(async (request, env, _ctx, middlewareCtx) => {
  try {
    return await middlewareCtx.next(request, env);
  } finally {
    try {
      if (request.body !== null && !request.bodyUsed) {
        const reader = request.body.getReader();
        while (!(await reader.read()).done) {
        }
      }
    } catch (e) {
      console.error("Failed to drain the unused request body.", e);
    }
  }
}, "drainBody");
var middleware_ensure_req_body_drained_default2 = drainBody2;

// node_modules/wrangler/templates/middleware/middleware-miniflare3-json-error.ts
function reduceError2(e) {
  return {
    name: e?.name,
    message: e?.message ?? String(e),
    stack: e?.stack,
    cause: e?.cause === void 0 ? void 0 : reduceError2(e.cause)
  };
}
__name(reduceError2, "reduceError");
var jsonError2 = /* @__PURE__ */ __name(async (request, env, _ctx, middlewareCtx) => {
  try {
    return await middlewareCtx.next(request, env);
  } catch (e) {
    const error = reduceError2(e);
    return Response.json(error, {
      status: 500,
      headers: { "MF-Experimental-Error-Stack": "true" }
    });
  }
}, "jsonError");
var middleware_miniflare3_json_error_default2 = jsonError2;

// .wrangler/tmp/bundle-2qr54Y/middleware-insertion-facade.js
var __INTERNAL_WRANGLER_MIDDLEWARE__2 = [
  middleware_ensure_req_body_drained_default2,
  middleware_miniflare3_json_error_default2
];
var middleware_insertion_facade_default2 = middleware_loader_entry_default;

// node_modules/wrangler/templates/middleware/common.ts
var __facade_middleware__2 = [];
function __facade_register__2(...args) {
  __facade_middleware__2.push(...args.flat());
}
__name(__facade_register__2, "__facade_register__");
function __facade_invokeChain__2(request, env, ctx, dispatch, middlewareChain) {
  const [head, ...tail] = middlewareChain;
  const middlewareCtx = {
    dispatch,
    next(newRequest, newEnv) {
      return __facade_invokeChain__2(newRequest, newEnv, ctx, dispatch, tail);
    }
  };
  return head(request, env, ctx, middlewareCtx);
}
__name(__facade_invokeChain__2, "__facade_invokeChain__");
function __facade_invoke__2(request, env, ctx, dispatch, finalMiddleware) {
  return __facade_invokeChain__2(request, env, ctx, dispatch, [
    ...__facade_middleware__2,
    finalMiddleware
  ]);
}
__name(__facade_invoke__2, "__facade_invoke__");

// .wrangler/tmp/bundle-2qr54Y/middleware-loader.entry.ts
var __Facade_ScheduledController__2 = class ___Facade_ScheduledController__2 {
  constructor(scheduledTime, cron, noRetry) {
    this.scheduledTime = scheduledTime;
    this.cron = cron;
    this.#noRetry = noRetry;
  }
  static {
    __name(this, "__Facade_ScheduledController__");
  }
  #noRetry;
  noRetry() {
    if (!(this instanceof ___Facade_ScheduledController__2)) {
      throw new TypeError("Illegal invocation");
    }
    this.#noRetry();
  }
};
function wrapExportedHandler2(worker) {
  if (__INTERNAL_WRANGLER_MIDDLEWARE__2 === void 0 || __INTERNAL_WRANGLER_MIDDLEWARE__2.length === 0) {
    return worker;
  }
  for (const middleware of __INTERNAL_WRANGLER_MIDDLEWARE__2) {
    __facade_register__2(middleware);
  }
  const fetchDispatcher = /* @__PURE__ */ __name(function(request, env, ctx) {
    if (worker.fetch === void 0) {
      throw new Error("Handler does not export a fetch() function.");
    }
    return worker.fetch(request, env, ctx);
  }, "fetchDispatcher");
  return {
    ...worker,
    fetch(request, env, ctx) {
      const dispatcher = /* @__PURE__ */ __name(function(type, init) {
        if (type === "scheduled" && worker.scheduled !== void 0) {
          const controller = new __Facade_ScheduledController__2(
            Date.now(),
            init.cron ?? "",
            () => {
            }
          );
          return worker.scheduled(controller, env, ctx);
        }
      }, "dispatcher");
      return __facade_invoke__2(request, env, ctx, dispatcher, fetchDispatcher);
    }
  };
}
__name(wrapExportedHandler2, "wrapExportedHandler");
function wrapWorkerEntrypoint2(klass) {
  if (__INTERNAL_WRANGLER_MIDDLEWARE__2 === void 0 || __INTERNAL_WRANGLER_MIDDLEWARE__2.length === 0) {
    return klass;
  }
  for (const middleware of __INTERNAL_WRANGLER_MIDDLEWARE__2) {
    __facade_register__2(middleware);
  }
  return class extends klass {
    #fetchDispatcher = /* @__PURE__ */ __name((request, env, ctx) => {
      this.env = env;
      this.ctx = ctx;
      if (super.fetch === void 0) {
        throw new Error("Entrypoint class does not define a fetch() function.");
      }
      return super.fetch(request);
    }, "#fetchDispatcher");
    #dispatcher = /* @__PURE__ */ __name((type, init) => {
      if (type === "scheduled" && super.scheduled !== void 0) {
        const controller = new __Facade_ScheduledController__2(
          Date.now(),
          init.cron ?? "",
          () => {
          }
        );
        return super.scheduled(controller);
      }
    }, "#dispatcher");
    fetch(request) {
      return __facade_invoke__2(
        request,
        this.env,
        this.ctx,
        this.#dispatcher,
        this.#fetchDispatcher
      );
    }
  };
}
__name(wrapWorkerEntrypoint2, "wrapWorkerEntrypoint");
var WRAPPED_ENTRY2;
if (typeof middleware_insertion_facade_default2 === "object") {
  WRAPPED_ENTRY2 = wrapExportedHandler2(middleware_insertion_facade_default2);
} else if (typeof middleware_insertion_facade_default2 === "function") {
  WRAPPED_ENTRY2 = wrapWorkerEntrypoint2(middleware_insertion_facade_default2);
}
var middleware_loader_entry_default2 = WRAPPED_ENTRY2;
export {
  __INTERNAL_WRANGLER_MIDDLEWARE__2 as __INTERNAL_WRANGLER_MIDDLEWARE__,
  middleware_loader_entry_default2 as default
};
//# sourceMappingURL=functionsWorker-0.8695546185825199.js.map
