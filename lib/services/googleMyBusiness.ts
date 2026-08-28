import { mybusiness_v4 } from 'googleapis';
import { ReviewCheckResult } from '@/types';

const SERVICE_ACCOUNT_EMAIL = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL!;
const PRIVATE_KEY = process.env.GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY!.replace(/\\n/g, '\n');

export const googleAuth = new mybusiness_v4.auth.JWT({
  email: SERVICE_ACCOUNT_EMAIL,
  key: PRIVATE_KEY,
  scopes: [
    'https://www.googleapis.com/auth/business.manage',
    'https://www.googleapis.com/auth/business.accountmanagement.accounts.readonly',
  ],
});

const mybusiness = new mybusiness_v4.Mybusiness({ auth: googleAuth });

export async function fetchNewReviews(
  accountId: string,
  locationId: string,
  lastChecked: Date
): Promise<ReviewCheckResult['newReviews']> {
  try {
    const response = await mybusiness.accounts.locations.reviews.list({
      parent: `accounts/${accountId}/locations/${locationId}`,
      pageSize: 50,
    });
    const reviews = response.data.reviews || [];
    return reviews
      .filter(r => new Date(r.createTime!) >= lastChecked)
      .map(r => ({
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
  await mybusiness.accounts.locations.reviews.reply({
    name: `accounts/${accountId}/locations/${locationId}/reviews/${reviewId}`,
    requestBody: {
      reply: { comment: replyText },
    },
  });
}