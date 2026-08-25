import { NextResponse } from 'next/server';
import { getCallsBySlug } from '@/lib/services/googleSheets';
import { getClientSession } from '@/lib/auth/session';

export async function GET(request: Request, { params }: { params: { slug: string } }) {
  if (!getClientSession(params.slug)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  try {
    const calls = await getCallsBySlug(params.slug);
    return NextResponse.json(calls);
  } catch (e) {
    return NextResponse.json({ error: 'Failed to fetch calls' }, { status: 500 });
  }
}