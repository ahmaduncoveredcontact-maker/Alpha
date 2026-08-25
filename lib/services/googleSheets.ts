// lib/services/googleSheets.ts
import { google } from 'googleapis';
import { CallLog } from '@/types';

const SPREADSHEET_ID = process.env.GOOGLE_SHEETS_SPREADSHEET_ID!;
const SERVICE_ACCOUNT_EMAIL = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL!;
const PRIVATE_KEY = process.env.GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY!.replace(/\\n/g, '\n');

const auth = new google.auth.JWT({
  email: SERVICE_ACCOUNT_EMAIL,
  key: PRIVATE_KEY,
  scopes: ['https://www.googleapis.com/auth/spreadsheets'],
});

const sheets = google.sheets({ version: 'v4', auth });

const HEADER_ROW = [
  'client_slug',
  'timestamp',
  'call_type',
  'customer_name',
  'customer_phone',
  'summary',
  'status',
  'booked_time',
  'recording_url',
];

/**
 * Ensure a sheet (tab) exists for the given slug.
 * If not, create it with the header row.
 */
async function ensureSheetExists(slug: string): Promise<void> {
  // Get spreadsheet metadata to list existing sheets
  const meta = await sheets.spreadsheets.get({
    spreadsheetId: SPREADSHEET_ID,
    fields: 'sheets.properties.title',
  });

  const existingTitles = meta.data.sheets?.map(s => s.properties?.title) || [];
  if (existingTitles.includes(slug)) {
    return; // Sheet already exists
  }

  // Create a new sheet with the slug as title
  await sheets.spreadsheets.batchUpdate({
    spreadsheetId: SPREADSHEET_ID,
    requestBody: {
      requests: [
        {
          addSheet: {
            properties: {
              title: slug,
            },
          },
        },
      ],
    },
  });

  // Add the header row to the new sheet
  await sheets.spreadsheets.values.update({
    spreadsheetId: SPREADSHEET_ID,
    range: `${slug}!A1:I1`,
    valueInputOption: 'USER_ENTERED',
    requestBody: {
      values: [HEADER_ROW],
    },
  });
}

/**
 * Append a single call log to the client's sheet.
 * Creates the sheet if it doesn't exist.
 */
export async function appendCallLog(log: CallLog): Promise<void> {
  await ensureSheetExists(log.client_slug);

  const values = [[
    log.client_slug,
    log.timestamp,
    log.call_type,
    log.customer_name,
    log.customer_phone,
    log.summary,
    log.status,
    log.booked_time || '',
    log.recording_url || '',
  ]];

  await sheets.spreadsheets.values.append({
    spreadsheetId: SPREADSHEET_ID,
    range: `${log.client_slug}!A:I`,
    valueInputOption: 'USER_ENTERED',
    requestBody: { values },
  });
}

/**
 * Fetch all call logs for a specific client from their sheet.
 */
export async function getCallsBySlug(slug: string): Promise<CallLog[]> {
  try {
    // First, check if the sheet exists
    const meta = await sheets.spreadsheets.get({
      spreadsheetId: SPREADSHEET_ID,
      fields: 'sheets.properties.title',
    });
    const existingTitles = meta.data.sheets?.map(s => s.properties?.title) || [];
    if (!existingTitles.includes(slug)) {
      return []; // No sheet -> no calls
    }

    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: SPREADSHEET_ID,
      range: `${slug}!A:I`,
    });

    const rows = response.data.values || [];
    if (rows.length <= 1) return []; // Only header or empty

    // Skip header row
    return rows.slice(1).map(row => ({
      client_slug: row[0] || slug,
      timestamp: row[1] || '',
      call_type: row[2] as CallLog['call_type'],
      customer_name: row[3] || '',
      customer_phone: row[4] || '',
      summary: row[5] || '',
      status: row[6] as CallLog['status'],
      booked_time: row[7] || null,
      recording_url: row[8] || null,
    }));
  } catch (error) {
    console.error(`Error fetching calls for ${slug}:`, error);
    return [];
  }
}

/**
 * Compute weekly stats for a client from their sheet.
 */
export async function getWeeklyStats(slug: string): Promise<{
  totalCalls: number;
  bookings: number;
  replies: number;
}> {
  const calls = await getCallsBySlug(slug);
  const now = new Date();
  const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

  const weekCalls = calls.filter(c => new Date(c.timestamp) >= weekAgo);
  const bookings = weekCalls.filter(c => c.status === 'Booked').length;

  // Replies count is not stored in Sheets – handled separately via GBP API.
  return {
    totalCalls: weekCalls.length,
    bookings: bookings,
    replies: 0,
  };
}

/**
 * Optional: Pre-create sheets for all clients (useful during onboarding).
 * Call this after creating a new client to ensure their sheet exists.
 */
export async function ensureClientSheet(slug: string): Promise<void> {
  await ensureSheetExists(slug);
}