import { supabaseServer } from "@/lib/supabase/server";
import { notFound, redirect } from "next/navigation";
import { getClientSession } from "@/lib/auth/session";
import ClientDashboard from "./ClientDashboard";

export default async function ClientDashboardPage({ params }: { params: { slug: string } }) {
  if (!getClientSession(params.slug)) redirect(`/live/${params.slug}`);
  const { data: client, error } = await supabaseServer.from("clients").select("*").eq("slug", params.slug).single();
  if (error || !client) notFound();
  return <ClientDashboard client={client} />;
}