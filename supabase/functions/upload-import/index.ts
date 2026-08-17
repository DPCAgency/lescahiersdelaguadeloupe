import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

const IMPORTS_BUCKET = "imports-private";
const MAX_SIZE = 100 * 1024 * 1024;

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    const formData = await req.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return new Response(JSON.stringify({ error: "Aucun fichier reçu." }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (file.size > MAX_SIZE) {
      return new Response(JSON.stringify({ error: "Le fichier est trop volumineux." }), {
        status: 413,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const allowedMimes = ["application/pdf", "image/jpeg", "image/png"];
    const mimeType = file.type || "application/octet-stream";
    if (!allowedMimes.includes(mimeType)) {
      return new Response(JSON.stringify({ error: "Type de fichier non supporté." }), {
        status: 415,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const { data: adminUser } = await supabase
      .from("profiles")
      .select("id")
      .eq("role", "super_admin")
      .eq("status", "active")
      .order("created_at", { ascending: true })
      .limit(1)
      .maybeSingle();

    if (!adminUser?.id) {
      return new Response(JSON.stringify({ error: "Aucun compte administrateur actif trouvé." }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const ext = mimeType === "application/pdf" ? "pdf" : mimeType === "image/png" ? "png" : "jpg";
    const timestamp = Date.now();
    const storagePath = `${adminUser.id}/${timestamp}/original.${ext}`;

    const arrayBuffer = await file.arrayBuffer();
    const buffer = new Uint8Array(arrayBuffer);

    const { error: uploadError } = await supabase.storage
      .from(IMPORTS_BUCKET)
      .upload(storagePath, buffer, {
        contentType: mimeType,
        upsert: false,
      });

    if (uploadError) {
      console.error("[IMPORT ERROR]", { step: "upload", message: uploadError.message });
      return new Response(JSON.stringify({ error: "Le Storage a refusé le fichier." }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const metadata = {
      original_filename: file.name,
      mime_type: mimeType,
      file_size: file.size,
      uploaded_by: adminUser.id,
      uploaded_at: new Date().toISOString(),
    };

    const { data: jobId, error: jobError } = await supabase.rpc("create_import_job_direct", {
      p_created_by: adminUser.id,
      p_source_file_path: storagePath,
      p_source_type: mimeType === "application/pdf" ? "pdf" : "images",
      p_metadata: metadata,
    });

    if (jobError || !jobId) {
      await supabase.storage.from(IMPORTS_BUCKET).remove([storagePath]);
      return new Response(JSON.stringify({ error: "La création du job d'import a échoué." }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ success: true, jobId, storagePath }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error("[IMPORT ERROR]", { step: "upload", message });
    return new Response(JSON.stringify({ error: "Échec de l'upload du fichier." }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
