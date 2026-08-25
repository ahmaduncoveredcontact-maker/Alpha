// app/(admin)/admin/page.tsx
import { supabaseServer } from "@/lib/supabase/server";
import Link from "next/link";
import { formatDate } from "@/lib/utils/formatDate";
import SyncGbpButton from "./SyncGbpButton"; // We'll create this client component

export default async function AdminDashboard() {
  const { data: clients, error } = await supabaseServer
    .from("clients")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) return <div className="text-destructive">Failed to load clients.</div>;

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Clients</h1>
        <div className="flex gap-2">
          <SyncGbpButton />
          <Link href="/admin/new" className="bg-primary text-primary-foreground px-4 py-2 rounded-md hover:opacity-90">
            + Add New Client
          </Link>
        </div>
      </div>

      {clients.length === 0 ? (
        <p className="text-muted-foreground">No clients yet. Click "Add New Client" to start.</p>
      ) : (
        <div className="border rounded-md overflow-hidden">
          <table className="w-full">
            <thead className="bg-muted/50">
              <tr>
                <th className="text-left p-3 font-medium">Business</th>
                <th className="text-left p-3 font-medium">Slug</th>
                <th className="text-left p-3 font-medium">Status</th>
                <th className="text-left p-3 font-medium">GBP Synced</th>
                <th className="text-left p-3 font-medium">Created</th>
                <th className="text-left p-3 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {clients.map((client) => (
                <tr key={client.id} className="border-t">
                  <td className="p-3">{client.business_name}</td>
                  <td className="p-3 font-mono text-sm">{client.slug}</td>
                  <td className="p-3">
                    <span className={`inline-block px-2 py-1 rounded-full text-xs ${
                      client.vapi_assistant_id && client.qr_main_url
                        ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300"
                        : "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300"
                    }`}>
                      {client.vapi_assistant_id && client.qr_main_url ? "Active" : "Setup pending"}
                    </span>
                  </td>
                  <td className="p-3">
                    {client.gbp_account_id && client.gbp_location_id ? (
                      <span className="text-green-600 dark:text-green-400 text-sm">✅ Synced</span>
                    ) : (
                      <span className="text-yellow-600 dark:text-yellow-400 text-sm">⏳ Not synced</span>
                    )}
                  </td>
                  <td className="p-3 text-sm">{formatDate(client.created_at)}</td>
                  <td className="p-3">
                    <Link href={`/admin/${client.slug}`} className="text-primary hover:underline text-sm">
                      View/Edit
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}