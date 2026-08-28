import { NextResponse } from 'next/server';
import { supabaseServer } from '@/lib/supabase/server';
import { getAdminSession } from '@/lib/auth/session';
import { google } from 'googleapis';
import { createSign } from 'crypto';

// ---- Direct copy of the working auth logic from debug-auth ----
function getCleanedKey() {
  let key = process.env.GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY || '';
  key = key.replace(/^["']|["']$/g, '');
  key = key.replace(/\\n/g, '\n');
  key = key.trim();
  return key;
}

function getAuth() {
  const email = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL;
  const key = getCleanedKey();
  return new google.auth.JWT({
    email,
    key,
    scopes: [
      'https://www.googleapis.com/auth/business.manage',
      'https://www.googleapis.com/auth/business.accountmanagement.accounts.readonly',
    ],
  });
}
// ---- End of auth logic ----

async function getAccounts() {
  const auth = getAuth();
  const accountManagement = google.mybusinessaccountmanagement({
    version: 'v1',
    auth,
  });
  const response = await accountManagement.accounts.list();
  return response.data.accounts || [];
}

async function getLocations(accountId: string) {
  const auth = getAuth();
  const businessInfo = google.mybusinessbusinessinformation({
    version: 'v1',
    auth,
  });
  const response = await businessInfo.accounts.locations.list({
    parent: `accounts/${accountId}`,
    pageSize: 100,
  });
  return response.data.locations || [];
}

export async function GET() {
  if (!getAdminSession()) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    // Test auth first (same as debug)
    try {
      const auth = getAuth();
      await auth.authorize();
    } catch (err: any) {
      return NextResponse.json({
        success: false,
        error: 'Authentication failed: ' + err.message,
      }, { status: 401 });
    }

    const { data: clients, error: clientsError } = await supabaseServer
      .from('clients')
      .select('id, business_name, slug');

    if (clientsError) throw new Error(`Failed to fetch clients: ${clientsError.message}`);

    const accounts = await getAccounts();
    if (accounts.length === 0) {
      return NextResponse.json({
        success: true,
        message: 'No Google Business accounts found. Add the service account as a manager to at least one GBP.',
        updatedCount: 0,
        matchedCount: 0,
        unmatchedCount: 0,
        unmatchedLocations: []
      });
    }

    let allLocations: any[] = [];
    for (const account of accounts) {
      const accountId = account.name!.replace('accounts/', '');
      const locations = await getLocations(accountId);
      allLocations = allLocations.concat(
        locations.map((loc: any) => ({
          accountId,
          locationId: loc.name!.split('/').pop()!,
          title: loc.title || '',
          storeCode: loc.storeCode || '',
          phoneNumber: loc.phoneNumbers?.[0] || '',
        }))
      );
    }

    if (allLocations.length === 0) {
      return NextResponse.json({
        success: true,
        message: 'No business locations found under any account.',
        updatedCount: 0,
        matchedCount: 0,
        unmatchedCount: 0,
        unmatchedLocations: []
      });
    }

    const matched: { clientId: string; accountId: string; locationId: string }[] = [];
    const unmatchedLocations: any[] = [];

    for (const location of allLocations) {
      const normalizedTitle = location.title.trim().toLowerCase();
      const client = clients.find(c => c.business_name.trim().toLowerCase() === normalizedTitle);
      if (client) {
        matched.push({
          clientId: client.id,
          accountId: location.accountId,
          locationId: location.locationId,
        });
      } else {
        unmatchedLocations.push(location);
      }
    }

    let updatedCount = 0;
    for (const match of matched) {
      const { error: updateError } = await supabaseServer
        .from('clients')
        .update({
          gbp_account_id: match.accountId,
          gbp_location_id: match.locationId,
        })
        .eq('id', match.clientId);
      if (!updateError) updatedCount++;
    }

    return NextResponse.json({
      success: true,
      updatedCount,
      matchedCount: matched.length,
      unmatchedCount: unmatchedLocations.length,
      unmatchedLocations: unmatchedLocations.map(l => ({
        title: l.title,
        storeCode: l.storeCode,
        phoneNumber: l.phoneNumber,
        accountId: l.accountId,
        locationId: l.locationId,
      })),
      message: `✅ Synced ${updatedCount} clients. ${unmatchedLocations.length} locations unmatched.`,
    });
  } catch (error: any) {
    console.error('Sync GBP error:', error);
    return NextResponse.json({
      success: false,
      error: error.message || 'Internal server error',
    }, { status: 500 });
  }
}