import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

const IMPORTS_BUCKET = "imports-private";

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
    const action = url.searchParams.get("action") ?? "delete";

    if (action === "delete") {
      const { jobId } = await req.json() as { jobId: string };
      if (!jobId) {
        return new Response(JSON.stringify({ error: "ID manquant" }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const { data: job } = await supabase
        .from("import_jobs")
        .select("source_file_path")
        .eq("id", jobId)
        .maybeSingle();

      if (job?.source_file_path) {
        await supabase.storage.from(IMPORTS_BUCKET).remove([job.source_file_path]);
      }

      await supabase.from("import_jobs").delete().eq("id", jobId);

      return new Response(JSON.stringify({ success: true }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (action === "upload") {
      const formData = await req.formData();
      const file = formData.get("file") as File | null;
      const path = formData.get("path") as string | null;
      const contentType = (formData.get("contentType") as string) || "application/octet-stream";

      if (!file || !path) {
        return new Response(JSON.stringify({ error: "Fichier ou chemin manquant" }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const arrayBuffer = await file.arrayBuffer();
      const buffer = new Uint8Array(arrayBuffer);

      const { error: uploadError } = await supabase.storage
        .from(IMPORTS_BUCKET)
        .upload(path, buffer, { contentType, upsert: true });

      if (uploadError) {
        return new Response(JSON.stringify({ error: uploadError.message }), {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      return new Response(JSON.stringify({ success: true, path }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (action === "download") {
      const { path } = await req.json() as { path: string };
      if (!path) {
        return new Response(JSON.stringify({ error: "Chemin manquant" }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const { data, error } = await supabase.storage
        .from(IMPORTS_BUCKET)
        .download(path);

      if (error || !data) {
        return new Response(JSON.stringify({ error: "Fichier introuvable" }), {
          status: 404,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const arrayBuffer = await data.arrayBuffer();
      return new Response(arrayBuffer, {
        headers: { ...corsHeaders, "Content-Type": "application/octet-stream" },
      });
    }

    return new Response(JSON.stringify({ error: "Action inconnue" }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error("[IMPORT ERROR]", { step: "storage-action", message });
    return new Response(JSON.stringify({ error: "Erreur serveur" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
