import { google } from 'googleapis';

let cachedAuth: any = null;
let authError: any = null;

function getAuthCredentials() {
  const email = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL;
  let key = process.env.GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY;

  if (!email) throw new Error('Missing GOOGLE_SERVICE_ACCOUNT_EMAIL');
  if (!key) throw new Error('Missing GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY');

  // Clean key
  key = key.replace(/^["']|["']$/g, '');          // Remove outer quotes
  key = key.replace(/\\n/g, '\n');                // Convert \n to newlines
  key = key.replace(/---BEGIN/g, '-----BEGIN');   // Fix malformed header
  key = key.replace(/---END/g, '-----END');       // Fix malformed footer

  // Validate
  if (!key.includes('-----BEGIN PRIVATE KEY-----')) {
    throw new Error('Private key does not contain BEGIN PRIVATE KEY');
  }
  if (!key.includes('-----END PRIVATE KEY-----')) {
    throw new Error('Private key does not contain END PRIVATE KEY');
  }

  return { email, key };
}

export function getGoogleAuth() {
  if (cachedAuth) return cachedAuth;
  if (authError) throw authError;

  try {
    const { email, key } = getAuthCredentials();
    cachedAuth = new google.auth.JWT({
      email,
      key,
      scopes: [
        'https://www.googleapis.com/auth/business.manage',
        'https://www.googleapis.com/auth/business.accountmanagement.accounts.readonly',
      ],
    });
    return cachedAuth;
  } catch (err) {
    authError = err;
    throw err;
  }
}

export async function testGoogleAuth() {
  try {
    const auth = getGoogleAuth();
    await auth.authorize();
    return { success: true, message: 'Authentication successful' };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export const googleAuth = new Proxy({} as any, {
  get(target, prop) {
    const auth = getGoogleAuth();
    return auth[prop];
  },
});