import { NextResponse } from 'next/server';
import { supabaseServer } from '@/lib/supabase/server';
import { fetchNewReviews, postReplyToReview } from '@/lib/services/googleMyBusiness';
import { generateReviewReply } from '@/lib/services/openrouter';

export async function GET(request: Request) {
  const cronSecret = request.headers.get('x-cron-secret');
  if (cronSecret !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const results: any[] = [];

  // Get clients with manager_access_granted = true and have GBP account/location IDs
  const { data: clients, error } = await supabaseServer
    .from('clients')
    .select('id, slug, business_name, service_area, gbp_account_id, gbp_location_id')
    .eq('manager_access_granted', true)
    .not('gbp_account_id', 'is', null)
    .not('gbp_location_id', 'is', null);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  for (const client of clients) {
    const { data: checkData } = await supabaseServer
      .from('client_review_checks')
      .select('last_checked_at')
      .eq('client_id', client.id)
      .single();

    const lastChecked = checkData?.last_checked_at
      ? new Date(checkData.last_checked_at)
      : new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

    const newReviews = await fetchNewReviews(
      client.gbp_account_id!,
      client.gbp_location_id!,
      lastChecked
    );

    for (const review of newReviews) {
      if (review.rating === 5) {
        const replyText = await generateReviewReply({
          businessName: client.business_name,
          serviceArea: client.service_area || 'your area',
          reviewerName: review.reviewerName,
          reviewText: review.text,
        });
        await postReplyToReview(
          client.gbp_account_id!,
          client.gbp_location_id!,
          review.reviewId,
          replyText
        );
        results.push({ client: client.slug, reviewId: review.reviewId, status: 'replied' });
      } else {
        results.push({ client: client.slug, reviewId: review.reviewId, status: 'skipped (not 5-star)' });
      }
    }

    await supabaseServer
      .from('client_review_checks')
      .upsert({ client_id: client.id, last_checked_at: new Date().toISOString() });
  }

  return NextResponse.json({ processed: clients.length, results });
}