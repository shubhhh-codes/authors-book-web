/**
 * Web Standard Cryptographic Helpers (Compatible with Next.js Edge Runtime & Node.js)
 */

const SECRET = process.env.NEXTAUTH_SECRET || process.env.RAZORPAY_KEY_SECRET || 'antigravity-secret-key-328947';

/**
 * Constant-time string comparison to prevent timing attacks
 */
export function timingSafeEqualStrings(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let result = 0;
  for (let i = 0; i < a.length; i++) {
    result |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return result === 0;
}

/**
 * Password verification using constant-time comparison
 */
export function timingSafePasswordCheck(inputPassword: string, actualPassword: string): boolean {
  if (!inputPassword || !actualPassword) return false;
  return timingSafeEqualStrings(inputPassword, actualPassword);
}

// Convert ArrayBuffer to Hex string
function bufferToHex(buffer: ArrayBuffer): string {
  return Array.from(new Uint8Array(buffer))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

// Generate HMAC-SHA256 signature using Web standard SubtleCrypto
async function generateHmacSha256(data: string, secret: string): Promise<string> {
  const encoder = new TextEncoder();
  const keyData = encoder.encode(secret);
  const messageData = encoder.encode(data);

  const cryptoKey = await crypto.subtle.importKey(
    'raw',
    keyData,
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );

  const signature = await crypto.subtle.sign('HMAC', cryptoKey, messageData);
  return bufferToHex(signature);
}

/**
 * Generates a cryptographically signed session token (HMAC-SHA256)
 * Format: timestamp.expiry.randomNonce.hmacSignature
 */
export async function signAdminSessionToken(): Promise<string> {
  const issuedAt = Date.now();
  const expiresAt = issuedAt + 7 * 24 * 60 * 60 * 1000; // 7 days
  const randomArray = new Uint8Array(16);
  crypto.getRandomValues(randomArray);
  const nonce = Array.from(randomArray).map((b) => b.toString(16).padStart(2, '0')).join('');

  const payload = `${issuedAt}.${expiresAt}.${nonce}`;
  const signature = await generateHmacSha256(payload, SECRET);

  return `${payload}.${signature}`;
}

/**
 * Verifies the cryptographic HMAC-SHA256 signature and expiration of an admin session token
 */
export async function verifyAdminSessionToken(token: string | undefined | null): Promise<boolean> {
  if (!token) return false;

  const parts = token.split('.');
  if (parts.length !== 4) return false;

  const [issuedAtStr, expiresAtStr, nonce, signature] = parts;
  const expiresAt = parseInt(expiresAtStr, 10);

  if (isNaN(expiresAt) || Date.now() > expiresAt) {
    return false; // Token expired
  }

  const payload = `${issuedAtStr}.${expiresAtStr}.${nonce}`;
  const expectedSignature = await generateHmacSha256(payload, SECRET);

  return timingSafeEqualStrings(signature, expectedSignature);
}
