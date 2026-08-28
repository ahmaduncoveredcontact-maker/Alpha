import { NextResponse } from 'next/server';
import { google } from 'googleapis';
import { googleAuth } from '@/lib/auth/googleAuth';
import { getAdminSession } from '@/lib/auth/session';

export async function GET() {
  if (!getAdminSession()) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const accountManagement = google.mybusinessaccountmanagement({
      version: 'v1',
      auth: googleAuth,
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