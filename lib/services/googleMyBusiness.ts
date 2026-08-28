import { google } from 'googleapis';
import { ReviewCheckResult } from '@/types';
import { googleAuth } from '@/lib/auth/googleAuth';

let mybusinessClient: any = null;

function getMyBusinessClient() {
  if (!mybusinessClient) {
    // @ts-ignore - google.mybusiness is callable at runtime
    mybusinessClient = google.mybusiness({ version: 'v4', auth: googleAuth });
  }
  return mybusinessClient;
}

export async function fetchNewReviews(
  accountId: string,
  locationId: string,
  lastChecked: Date
): Promise<ReviewCheckResult['newReviews']> {
  try {
    const mybusiness = getMyBusinessClient();
    const response = await mybusiness.accounts.locations.reviews.list({
      parent: `accounts/${accountId}/locations/${locationId}`,
      pageSize: 50,
    });
    const reviews: any[] = response.data.reviews || [];
    return reviews
      .filter((r: any) => new Date(r.createTime!) >= lastChecked)
      .map((r: any) => ({
        reviewId: r.reviewId!,
        reviewerName: r.reviewer?.displayName,
        rating: r.starRating!,
        text: r.comment || '',
        createTime: r.createTime!,
      }));
  } catch (error) {
    console.error('Error fetching reviews:', error);
    return [];
  }
}

export async function postReplyToReview(
  accountId: string,
  locationId: string,
  reviewId: string,
  replyText: string
): Promise<void> {
  const mybusiness = getMyBusinessClient();
  await mybusiness.accounts.locations.reviews.reply({
    name: `accounts/${accountId}/locations/${locationId}/reviews/${reviewId}`,
    requestBody: {
      reply: { comment: replyText },
    },
  });
}