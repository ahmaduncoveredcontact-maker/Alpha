import { NextResponse } from 'next/server';
import { supabaseServer } from '@/lib/supabase/server';
import { getGoogleAuth, testGoogleAuth } from '@/lib/auth/googleAuth';
import { getAdminSession } from '@/lib/auth/session';
import { google } from 'googleapis';

export async function GET() {
  if (!getAdminSession()) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Step 1: Test credentials using the shared module
  const authTest = await testGoogleAuth();
  if (!authTest.success) {
    return NextResponse.json({
      success: false,
      error: 'Authentication failed: ' + authTest.error,
    }, { status: 401 });
  }

  // Step 2: Proceed with sync logic
  try {
    const auth = getGoogleAuth();

    // List accounts
    const accountManagement = google.mybusinessaccountmanagement({
      version: 'v1',
      auth,
    });
    const accountsResponse = await accountManagement.accounts.list();
    const accounts = accountsResponse.data.accounts || [];

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

    // Fetch clients
    const { data: clients, error: clientsError } = await supabaseServer
      .from('clients')
      .select('id, business_name, slug');

    if (clientsError) throw new Error(`Failed to fetch clients: ${clientsError.message}`);

    let allLocations: any[] = [];
    const businessInfo = google.mybusinessbusinessinformation({
      version: 'v1',
      auth,
    });

    for (const account of accounts) {
      const accountId = account.name!.replace('accounts/', '');
      const locationsResponse = await businessInfo.accounts.locations.list({
        parent: `accounts/${accountId}`,
        pageSize: 100,
      });
      const locations = locationsResponse.data.locations || [];
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

    // Match locations with clients
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