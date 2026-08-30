import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

const model = "gpt-4o";

const systemPrompt = `Tu analyses une page réelle des Cahiers de la Guadeloupe. Retourne uniquement un JSON valide.

Format exact:
{
  "page_number": number,
  "blocks": [
    {
      "type": "heading" | "subheading" | "paragraph" | "image" | "caption" | "quote" | "key_figure" | "timeline" | "sidebar" | "footer" | "source" | "unknown",
      "source_text": string,
      "bounding_box": { "x": number, "y": number, "width": number, "height": number } | null,
      "confidence": number,
      "description": string | null,
      "caption": string | null,
      "credit": string | null,
      "is_photo": boolean | null
    }
  ]
}

Règles impératives:
- Transcris exactement le texte visible en français, en conservant accents, apostrophes, guillemets et symbole €.
- Ne réécris pas les citations, témoignages, accusations ou hypothèses.
- Ne fabrique aucun texte, fait, crédit ou légende. Utilise une chaîne vide si aucun texte n'est visible.
- Utilise unknown si la classification est incertaine.
- Les coordonnées sont normalisées entre 0 et 1, origine en haut à gauche.
- Si la zone n'est pas fiable, retourne bounding_box null et confidence <= 0.3.
- Pour une image, décris seulement ce qui est visible et mets credit à null si aucun crédit n'est visible.`;

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response(null, { status: 200, headers: corsHeaders });

  try {
    const apiKey = Deno.env.get("OPENAI_API_KEY");
    if (!apiKey) return jsonResponse({ error: "OpenAI non configuré" }, 503);

    const url = new URL(req.url);
    if (req.method === "GET" || url.searchParams.get("action") === "health") {
      const response = await fetch("https://api.openai.com/v1/models", {
        headers: { Authorization: `Bearer ${apiKey}` },
        signal: AbortSignal.timeout(10000),
      });
      return jsonResponse({ available: response.ok, model });
    }

    const body = await req.json() as { imageBase64?: string; pageNumber?: number };
    if (!body.imageBase64 || !body.pageNumber) return jsonResponse({ error: "Image et numéro de page requis" }, 400);

    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model,
        max_tokens: 8192,
        messages: [
          { role: "system", content: systemPrompt },
          {
            role: "user",
            content: [
              { type: "text", text: `Analyse la page ${body.pageNumber}. Retourne le JSON demandé.` },
              { type: "image_url", image_url: { url: `data:image/png;base64,${body.imageBase64}`, detail: "high" } },
            ],
          },
        ],
        response_format: { type: "json_object" },
      }),
    });

    if (!response.ok) {
      const message = await response.text();
      console.error("[OPENAI ERROR]", { status: response.status, message: message.slice(0, 300) });
      return jsonResponse({ error: "OpenAI a refusé l'analyse" }, response.status);
    }

    const result = await response.json() as { choices?: { message?: { content?: string } }[] };
    const content = result.choices?.[0]?.message?.content;
    if (!content) return jsonResponse({ error: "Réponse OpenAI vide" }, 502);

    try {
      const parsed = JSON.parse(content) as Record<string, unknown>;
      return jsonResponse({ ...parsed, page_number: body.pageNumber });
    } catch {
      return jsonResponse({ error: "Réponse OpenAI invalide" }, 502);
    }
  } catch (error) {
    console.error("[OPENAI ERROR]", { message: error instanceof Error ? error.message : String(error) });
    return jsonResponse({ error: "Service OpenAI indisponible" }, 500);
  }
});
