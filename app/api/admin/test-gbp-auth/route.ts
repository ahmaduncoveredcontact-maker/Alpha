import { NextResponse } from 'next/server';
import { google } from 'googleapis';
import { getGoogleAuth, testGoogleAuth } from '@/lib/auth/googleAuth';
import { getAdminSession } from '@/lib/auth/session';

export async function GET() {
  if (!getAdminSession()) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Step 1: Test credentials
  const authTest = await testGoogleAuth();
  if (!authTest.success) {
    return NextResponse.json({
      success: false,
      error: 'Authentication failed',
      details: authTest.error,
    }, { status: 401 });
  }

  // Step 2: Try to list accounts
  try {
    const auth = getGoogleAuth();
    const accountManagement = google.mybusinessaccountmanagement({
      version: 'v1',
      auth,
    });
    const response = await accountManagement.accounts.list();
    return NextResponse.json({
      success: true,
      accounts: response.data.accounts || [],
      message: 'Authentication successful!',
    });
  } catch (error: any) {
    console.error('Test auth error:', error);
    return NextResponse.json({
      success: false,
      error: error.message,
      details: error.response?.data?.error || error.stack,
    }, { status: 500 });
  }
}