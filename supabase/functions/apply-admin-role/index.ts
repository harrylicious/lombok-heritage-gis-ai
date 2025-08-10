import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
const SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
const ADMIN_SECURITY_CODE = Deno.env.get("ADMIN_SECURITY_CODE");

if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
  console.error("Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY env var");
}

const supabaseAdmin = createClient(SUPABASE_URL!, SERVICE_ROLE_KEY!);

interface ApplyAdminPayload {
  securityCode: string;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Missing Authorization header" }), {
        status: 401,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    const { data: userData, error: userErr } = await supabaseAdmin.auth.getUser(
      authHeader.replace("Bearer ", "")
    );

    if (userErr || !userData?.user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    const { securityCode } = (await req.json()) as ApplyAdminPayload;

    if (!securityCode || !ADMIN_SECURITY_CODE || securityCode !== ADMIN_SECURITY_CODE) {
      return new Response(JSON.stringify({ error: "Invalid security code" }), {
        status: 403,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    const userId = userData.user.id;

    // Try update first
    const { error: updateErr, count } = await supabaseAdmin
      .from("profiles")
      .update({ role: "admin" })
      .eq("user_id", userId)
      .select("user_id", { count: "exact", head: true });

    if (updateErr) {
      console.error("Update error:", updateErr);
    }

    if (!count || count === 0) {
      // Fallback to insert if profile doesn't exist yet
      const { error: insertErr } = await supabaseAdmin.from("profiles").insert({
        user_id: userId,
        role: "admin",
      });
      if (insertErr) {
        console.error("Insert error:", insertErr);
        return new Response(JSON.stringify({ error: insertErr.message }), {
          status: 500,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        });
      }
    }

    return new Response(
      JSON.stringify({ success: true, message: "Admin role applied" }),
      { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  } catch (e: any) {
    console.error("apply-admin-role error:", e);
    return new Response(JSON.stringify({ error: e?.message || "Server error" }), {
      status: 500,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  }
});
