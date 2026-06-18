// Helper de Autenticação JWT e Senhas usando Web Crypto API nativa

// Converte ArrayBuffer para string Base64URL
function arrayBufferToBase64Url(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  let binary = '';
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary)
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');
}

// Converte string Base64URL para ArrayBuffer
function base64UrlToArrayBuffer(base64Url: string): ArrayBuffer {
  const base64 = base64Url
    .replace(/-/g, '+')
    .replace(/_/g, '/');
  const padLen = (4 - (base64.length % 4)) % 4;
  const padded = base64 + '='.repeat(padLen);
  const binary = atob(padded);
  const buffer = new ArrayBuffer(binary.length);
  const bytes = new Uint8Array(buffer);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return buffer;
}

// Gera Hash SHA-256 de forma síncrona/assíncrona usando Web Crypto
export async function hashPassword(password: string): Promise<string> {
  const msgBuffer = new TextEncoder().encode(password);
  const hashBuffer = await crypto.subtle.digest('SHA-256', msgBuffer);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

// Gera um Token JWT assinado com HMAC-SHA256
export async function generateJWT(payload: any, secret: string): Promise<string> {
  const header = { alg: 'HS256', typ: 'JWT' };
  
  const headerStr = arrayBufferToBase64Url(new TextEncoder().encode(JSON.stringify(header)));
  const payloadStr = arrayBufferToBase64Url(new TextEncoder().encode(JSON.stringify(payload)));
  
  const tokenInput = `${headerStr}.${payloadStr}`;
  
  const encoder = new TextEncoder();
  const key = await crypto.subtle.importKey(
    'raw',
    encoder.encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );
  
  const signatureBuffer = await crypto.subtle.sign(
    'HMAC',
    key,
    encoder.encode(tokenInput)
  );
  
  const signatureStr = arrayBufferToBase64Url(signatureBuffer);
  
  return `${tokenInput}.${signatureStr}`;
}

// Verifica um Token JWT e retorna o payload
export async function verifyJWT(token: string, secret: string): Promise<any | null> {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return null;
    
    const [headerStr, payloadStr, signatureStr] = parts;
    const tokenInput = `${headerStr}.${payloadStr}`;
    
    const encoder = new TextEncoder();
    const key = await crypto.subtle.importKey(
      'raw',
      encoder.encode(secret),
      { name: 'HMAC', hash: 'SHA-256' },
      false,
      ['verify']
    );
    
    const signatureBuffer = base64UrlToArrayBuffer(signatureStr);
    const isValid = await crypto.subtle.verify(
      'HMAC',
      key,
      signatureBuffer,
      encoder.encode(tokenInput)
    );
    
    if (!isValid) return null;
    
    // Decodifica o payload
    const decodedPayload = atob(payloadStr.replace(/-/g, '+').replace(/_/g, '/'));
    return JSON.parse(decodedPayload);
  } catch (e) {
    return null;
  }
}

// Extrai e valida o usuário do header Authorization
export async function getAuthUser(request: Request, secret: string): Promise<{ userId: string; role: 'admin' | 'client'; clientId: string } | null> {
  const authHeader = request.headers.get('Authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null;
  }
  
  const token = authHeader.substring(7);
  return await verifyJWT(token, secret);
}
