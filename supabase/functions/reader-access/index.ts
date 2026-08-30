import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const url = new URL(req.url);
    const action = url.searchParams.get("action") ?? "check";

    if (action === "check") {
      const { userId, issueId, pageNumber } = await req.json() as {
        userId: string | null;
        issueId: string;
        pageNumber?: number;
      };

      let isAdmin = false;

      if (userId) {
        const { data: profile } = await supabase
          .from("profiles")
          .select("role")
          .eq("id", userId)
          .maybeSingle();

        if (profile && ["editor", "admin", "super_admin"].includes(profile.role)) {
          isAdmin = true;
        }
      }

      if (isAdmin) {
        return new Response(JSON.stringify({
          hasAccess: true,
          reason: "admin",
          canDownload: true,
        }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      let hasFullIssue = false;
      let hasPage = false;

      if (userId) {
        const { data: entitlements } = await supabase
          .from("entitlements")
          .select("resource_type, source_type")
          .eq("user_id", userId)
          .eq("resource_id", issueId)
          .or(`expires_at.is.null,expires_at.gt.${new Date().toISOString()}`);

        for (const ent of entitlements ?? []) {
          if (ent.resource_type === "issue_full") {
            hasFullIssue = true;
          }
          if (ent.resource_type === "issue_page" && ent.source_type === `page_${pageNumber}`) {
            hasPage = true;
          }
        }
      }

      const hasAccess = hasFullIssue || (pageNumber !== undefined && hasPage);

      return new Response(JSON.stringify({
        hasAccess,
        reason: hasFullIssue ? "issue_full" : hasPage ? "issue_page" : "none",
        canDownload: hasFullIssue,
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (action === "page-image") {
      const { path, quality } = await req.json() as { path: string; quality: "thumbnail" | "preview" | "full" };

      if (!path) {
        return new Response(JSON.stringify({ error: "Path required" }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const { data, error } = await supabase.storage
        .from("imports-private")
        .download(path);

      if (error || !data) {
        return new Response(JSON.stringify({ error: "Image not found" }), {
          status: 404,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const arrayBuffer = await data.arrayBuffer();
      return new Response(arrayBuffer, {
        headers: {
          ...corsHeaders,
          "Content-Type": "image/png",
          "Cache-Control": "public, max-age=3600",
        },
      });
    }

    return new Response(JSON.stringify({ error: "Unknown action" }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("[ENTITLEMENT ERROR]", err instanceof Error ? err.message : String(err));
    return new Response(JSON.stringify({ error: "Server error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
