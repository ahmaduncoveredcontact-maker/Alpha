import { NextResponse } from 'next/server';
import { clearClientSession } from '@/lib/auth/session';

export async function POST(request: Request) {
  const { slug } = await request.json();
  if (!slug) return NextResponse.json({ error: 'Slug required' }, { status: 400 });
  clearClientSession(slug);
  return NextResponse.json({ success: true });
}