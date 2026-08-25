import { NextResponse } from 'next/server';
import { getWeeklyStats } from '@/lib/services/googleSheets';
import { getClientSession } from '@/lib/auth/session';

export async function GET(request: Request, { params }: { params: { slug: string } }) {
  if (!getClientSession(params.slug)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  try {
    const stats = await getWeeklyStats(params.slug);
    return NextResponse.json({ totalCalls: stats.totalCalls, bookings: stats.bookings, reviewsReplied: 0 });
  } catch (e) {
    return NextResponse.json({ error: 'Failed to fetch stats' }, { status: 500 });
  }
}