import { serve } from "https://deno.land/std@0.177.0/http/server.ts";

serve(async (req) => {
  try {
    const { userId } = await req.json();
    if (!userId) return new Response("Missing userId", { status: 400 });

    const adminKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    const projectUrl = Deno.env.get("SUPABASE_URL");
    if (!adminKey || !projectUrl) {
      return new Response("Missing env vars", { status: 500 });
    }

    // Delete auth user (profiles row will cascade if FK has ON DELETE CASCADE)
    const resp = await fetch(`${projectUrl}/auth/v1/admin/users/${userId}`, {
      method: "DELETE",
      headers: {
        apikey: adminKey,
        Authorization: `Bearer ${adminKey}`,
      },
    });

    if (!resp.ok) {
      const text = await resp.text();
      return new Response(text || "Delete failed", { status: resp.status });
    }
    return new Response("OK", { status: 200 });
  } catch (err) {
    return new Response(err?.message ?? "Error", { status: 400 });
  }
});