import { NextResponse } from 'next/server';
import { getAdminSession } from '@/lib/auth/session';
import { getGoogleAuth } from '@/lib/auth/googleAuth';

export async function GET() {
  if (!getAdminSession()) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const email = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL || 'not set';
  const rawKey = process.env.GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY || '';
  const keyLength = rawKey.length;
  const keyStart = rawKey.substring(0, 50);
  const keyEnd = rawKey.substring(rawKey.length - 50);

  // Attempt to get the auth client
  let authStatus: any = { success: false, error: 'Not tested' };
  try {
    const auth = getGoogleAuth();
    await auth.authorize();
    authStatus = { success: true };
  } catch (err: any) {
    authStatus = { success: false, error: err.message };
  }

  return NextResponse.json({
    email,
    keyLength,
    keyStart,
    keyEnd,
    authStatus,
  });
}