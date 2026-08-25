import { supabaseServer } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

export async function GET(request: Request, { params }: { params: { slug: string } }) {
  const { data: client, error } = await supabaseServer.from("clients").select("google_review_link").eq("slug", params.slug).single();
  if (error || !client || !client.google_review_link) redirect("/");
  redirect(client.google_review_link);
}