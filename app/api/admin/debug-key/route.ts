import { NextResponse } from 'next/server';
import { getAdminSession } from '@/lib/auth/session';
import { createSign, generateKeyPairSync } from 'crypto';

export async function GET() {
  if (!getAdminSession()) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const email = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL || 'not set';
  let rawKey = process.env.GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY || '';
  const keyLength = rawKey.length;

  // Apply same cleaning as in googleAuth.ts
  let cleanedKey = rawKey.replace(/^["']|["']$/g, '');
  cleanedKey = cleanedKey.replace(/\\n/g, '\n');
  cleanedKey = cleanedKey.replace(/---BEGIN/g, '-----BEGIN');
  cleanedKey = cleanedKey.replace(/---END/g, '-----END');
  cleanedKey = cleanedKey.trim();

  const cleanedStart = cleanedKey.substring(0, 60);
  const cleanedEnd = cleanedKey.substring(cleanedKey.length - 60);

  // Test the key using crypto.createSign
  let cryptoTest: any = { success: false, error: 'Not tested' };
  try {
    const testData = 'Hello, world!';
    const sign = createSign('sha256');
    sign.update(testData);
    const signature = sign.sign(cleanedKey, 'base64');
    cryptoTest = { success: true, signatureLength: signature.length };
  } catch (err: any) {
    cryptoTest = { success: false, error: err.message };
  }

  // Test JWT authorization
  let jwtTest: any = { success: false, error: 'Not tested' };
  if (cryptoTest.success) {
    try {
      const { google } = require('googleapis');
      const auth = new google.auth.JWT({
        email,
        key: cleanedKey,
        scopes: ['https://www.googleapis.com/auth/business.manage'],
      });
      await auth.authorize();
      jwtTest = { success: true };
    } catch (err: any) {
      jwtTest = { success: false, error: err.message };
    }
  }

  return NextResponse.json({
    email,
    keyLength,
    cleanedStart,
    cleanedEnd,
    cryptoTest,
    jwtTest,
  });
}