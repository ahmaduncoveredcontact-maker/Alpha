// app/api/admin/sync-gbp/route.ts
import { NextResponse } from 'next/server';
import { supabaseServer } from '@/lib/supabase/server';
import { googleAuth } from '@/lib/services/googleMyBusiness';
import { getAdminSession } from '@/lib/auth/session';

// Helper to fetch all accounts the service account has access to
async function getAccounts() {
  const accountManagement = google.mybusinessaccountmanagement({ version: 'v1', auth: googleAuth });
  const response = await accountManagement.accounts.list();
  return response.data.accounts || [];
}

// Helper to fetch all locations for a given account
async function getLocations(accountId: string) {
  const mybusiness = google.mybusinessbusinessinformation({ version: 'v1', auth: googleAuth });
  const response = await mybusiness.accounts.locations.list({
    parent: `accounts/${accountId}`,
    pageSize: 100, // adjust if needed, handle pagination later
  });
  return response.data.locations || [];
}

export async function GET() {
  // Admin session check
  if (!getAdminSession()) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    // 1. Fetch all clients from Supabase
    const { data: clients, error: clientsError } = await supabaseServer
      .from('clients')
      .select('id, business_name, slug');

    if (clientsError) {
      throw new Error(`Failed to fetch clients: ${clientsError.message}`);
    }

    // 2. Fetch all accounts and locations from GBP
    const accounts = await getAccounts();
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

    // 3. Match clients by business name (case-insensitive, trimmed)
    const matched: { clientId: string; accountId: string; locationId: string }[] = [];
    const unmatchedLocations: any[] = [];

    for (const location of allLocations) {
      const normalizedTitle = location.title.trim().toLowerCase();
      // Find client with matching business name
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

    // 4. Update matched clients with GBP IDs
    let updatedCount = 0;
    for (const match of matched) {
      const { error: updateError } = await supabaseServer
        .from('clients')
        .update({
          gbp_account_id: match.accountId,
          gbp_location_id: match.locationId,
        })
        .eq('id', match.clientId);

      if (updateError) {
        console.error(`Failed to update client ${match.clientId}:`, updateError);
      } else {
        updatedCount++;
      }
    }

    // 5. Return results
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
      message: `✅ Synced ${updatedCount} clients. ${unmatchedLocations.length} locations found without a matching client.`,
    });
  } catch (error: any) {
    console.error('Sync GBP error:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}