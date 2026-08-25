// app/(admin)/admin/SyncGbpButton.tsx
"use client";

import { useState } from "react";

export default function SyncGbpButton() {
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleSync = async () => {
    setLoading(true);
    setMessage(null);
    setError(null);

    try {
      const res = await fetch("/api/admin/sync-gbp");
      const data = await res.json();

      if (res.ok) {
        setMessage(data.message || `Synced ${data.updatedCount} clients.`);
        if (data.unmatchedCount > 0) {
          setMessage(prev => prev + ` ${data.unmatchedCount} locations found without a matching client.`);
        }
      } else {
        setError(data.error || "Sync failed");
      }
    } catch (err) {
      setError("Network error – please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex items-center gap-2">
      <button
        onClick={handleSync}
        disabled={loading}
        className="bg-secondary text-secondary-foreground px-4 py-2 rounded-md hover:bg-secondary/80 disabled:opacity-50 transition"
      >
        {loading ? "Syncing..." : "🔄 Sync GBP Locations"}
      </button>
      {message && <span className="text-sm text-green-600 dark:text-green-400">{message}</span>}
      {error && <span className="text-sm text-destructive">{error}</span>}
    </div>
  );
}