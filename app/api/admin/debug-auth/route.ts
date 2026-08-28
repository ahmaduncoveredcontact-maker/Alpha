import { NextResponse } from 'next/server';
import { getAdminSession } from '@/lib/auth/session';

export async function GET() {
  if (!getAdminSession()) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const email = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL || 'not set';
  let rawKey = process.env.GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY || '';
  const keyLength = rawKey.length;

  // Apply the same fixes as in googleAuth.ts
  let fixedKey = rawKey.replace(/^["']|["']$/g, '');
  fixedKey = fixedKey.replace(/\\n/g, '\n');
  fixedKey = fixedKey.replace(/---BEGIN/g, '-----BEGIN');
  fixedKey = fixedKey.replace(/---END/g, '-----END');

  const rawStart = rawKey.substring(0, 50);
  const fixedStart = fixedKey.substring(0, 50);

  // Attempt to authorize with the fixed key
  let authStatus: any = { success: false, error: 'Not tested' };
  try {
    const { google } = require('googleapis');
    const auth = new google.auth.JWT({
      email,
      key: fixedKey,
      scopes: ['https://www.googleapis.com/auth/business.manage'],
    });
    await auth.authorize();
    authStatus = { success: true };
  } catch (err: any) {
    authStatus = { success: false, error: err.message };
  }

  return NextResponse.json({
    email,
    keyLength,
    rawStart,
    fixedStart,
    authStatus,
  });
}