import { NextResponse } from 'next/server';
import { setAdminSession } from '@/lib/auth/session';

export async function POST(request: Request) {
  const { password } = await request.json();
  if (password === process.env.ADMIN_PASSWORD) {
    setAdminSession();
    return NextResponse.json({ success: true });
  }
  return NextResponse.json({ error: 'Invalid password' }, { status: 401 });
}