import { NextResponse } from 'next/server';
import { supabaseServer } from '@/lib/supabase/server';
import { google } from 'googleapis';
import { getGoogleAuth } from '@/lib/auth/googleAuth';
import { getAdminSession } from '@/lib/auth/session';

async function getAccounts() {
  const auth = getGoogleAuth();
  const accountManagement = google.mybusinessaccountmanagement({
    version: 'v1',
    auth,
  });
  const response = await accountManagement.accounts.list();
  return response.data.accounts || [];
}

async function getLocations(accountId: string) {
  const auth = getGoogleAuth();
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
    const { data: clients, error: clientsError } = await supabaseServer
      .from('clients')
      .select('id, business_name, slug');

    if (clientsError) throw new Error(`Failed to fetch clients: ${clientsError.message}`);

    const accounts = await getAccounts();
    if (accounts.length === 0) {
      return NextResponse.json({
        success: true,
        message: 'No Google Business accounts found. Ensure the service account has been added as a manager to at least one GBP.',
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