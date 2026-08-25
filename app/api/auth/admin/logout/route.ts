import { NextResponse } from 'next/server';
import { clearAdminSession } from '@/lib/auth/session';

export async function POST() {
  clearAdminSession();
  return NextResponse.json({ success: true });
}