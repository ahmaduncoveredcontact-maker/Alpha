import { google } from 'googleapis';

const SERVICE_ACCOUNT_EMAIL = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL!;
let PRIVATE_KEY = process.env.GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY!;

if (!SERVICE_ACCOUNT_EMAIL) {
  throw new Error('Missing GOOGLE_SERVICE_ACCOUNT_EMAIL');
}
if (!PRIVATE_KEY) {
  throw new Error('Missing GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY');
}

// Clean the key:
// 1. Remove surrounding quotes (if any)
// 2. Replace escaped newlines with actual newlines
// 3. Trim extra whitespace
// 4. Ensure it starts with -----BEGIN and ends with -----END
PRIVATE_KEY = PRIVATE_KEY.replace(/^["']|["']$/g, ''); // strip outer quotes
PRIVATE_KEY = PRIVATE_KEY.replace(/\\n/g, '\n'); // convert \n to newlines

// Validate PEM format
if (!PRIVATE_KEY.includes('-----BEGIN PRIVATE KEY-----')) {
  throw new Error('Private key does not contain BEGIN PRIVATE KEY');
}
if (!PRIVATE_KEY.includes('-----END PRIVATE KEY-----')) {
  throw new Error('Private key does not contain END PRIVATE KEY');
}

export const googleAuth = new google.auth.JWT({
  email: SERVICE_ACCOUNT_EMAIL,
  key: PRIVATE_KEY,
  scopes: [
    'https://www.googleapis.com/auth/business.manage',
    'https://www.googleapis.com/auth/business.accountmanagement.accounts.readonly',
  ],
});