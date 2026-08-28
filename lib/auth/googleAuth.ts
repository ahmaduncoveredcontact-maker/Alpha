import { google } from 'googleapis';

const SERVICE_ACCOUNT_EMAIL = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL!;
let PRIVATE_KEY = process.env.GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY!;

if (!SERVICE_ACCOUNT_EMAIL) {
  throw new Error('Missing GOOGLE_SERVICE_ACCOUNT_EMAIL');
}
if (!PRIVATE_KEY) {
  throw new Error('Missing GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY');
}

// Clean the key
PRIVATE_KEY = PRIVATE_KEY.replace(/^["']|["']$/g, '');
PRIVATE_KEY = PRIVATE_KEY.replace(/\\n/g, '\n');

// Validate PEM format
if (!PRIVATE_KEY.includes('-----BEGIN PRIVATE KEY-----')) {
  throw new Error('Private key is missing BEGIN PRIVATE KEY');
}
if (!PRIVATE_KEY.includes('-----END PRIVATE KEY-----')) {
  throw new Error('Private key is missing END PRIVATE KEY');
}

export const googleAuth = new google.auth.JWT({
  email: SERVICE_ACCOUNT_EMAIL,
  key: PRIVATE_KEY,
  scopes: [
    'https://www.googleapis.com/auth/business.manage',
    'https://www.googleapis.com/auth/business.accountmanagement.accounts.readonly',
  ],
});

// Add a test method to verify credentials early
export async function testGoogleAuth() {
  try {
    // Attempt to get an access token to validate the credentials
    await googleAuth.authorize();
    return { success: true, message: 'Authentication successful' };
  } catch (error: any) {
    return { success: false, error: error.message, stack: error.stack };
  }
}