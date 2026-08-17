import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2";
import Stripe from "npm:stripe@17.2.0";

Deno.serve(async (req: Request) => {
  const corsHeaders = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey, Stripe-Signature",
  };

  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    const stripeKey = Deno.env.get("STRIPE_SECRET_KEY");
    const webhookSecret = Deno.env.get("STRIPE_WEBHOOK_SECRET");

    if (!stripeKey || !webhookSecret) {
      return new Response(JSON.stringify({ error: "Stripe non configuré" }), {
        status: 503,
        headers: { "Content-Type": "application/json" },
      });
    }

    const stripe = new Stripe(stripeKey);
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const signature = req.headers.get("Stripe-Signature") ?? "";
    const rawBody = await req.text();

    let event: Stripe.Event;
    try {
      event = await stripe.webhooks.constructEventAsync(
        rawBody,
        signature,
        webhookSecret,
      );
    } catch {
      return new Response(JSON.stringify({ error: "Signature invalide" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    if (event.type === "checkout.session.completed") {
      const session = event.data.object as Stripe.Checkout.Session;
      const metadata = session.metadata ?? {};

      const orderId = metadata.order_id;
      const userId = metadata.user_id;
      const resourceId = metadata.resource_id;
      const resourceType = metadata.resource_type;

      if (!orderId || !userId || !resourceId) {
        return new Response(JSON.stringify({ received: true, warning: "Missing metadata" }), {
          headers: { "Content-Type": "application/json" },
        });
      }

      const { data: existingOrder } = await supabase
        .from("orders")
        .select("status")
        .eq("id", orderId)
        .maybeSingle();

      if (existingOrder?.status === "paid") {
        return new Response(JSON.stringify({ received: true, duplicate: true }), {
          headers: { "Content-Type": "application/json" },
        });
      }

      await supabase
        .from("orders")
        .update({ status: "paid", updated_at: new Date().toISOString() })
        .eq("id", orderId);

      if (resourceType === "issue") {
        await supabase.from("entitlements").insert({
          user_id: userId,
          resource_type: "issue_full",
          resource_id: resourceId,
          source_type: "stripe",
          source_id: orderId,
          starts_at: new Date().toISOString(),
        });
      } else if (resourceType === "page_access" && metadata.page_number) {
        await supabase.from("entitlements").insert({
          user_id: userId,
          resource_type: "issue_page",
          resource_id: resourceId,
          source_type: `page_${metadata.page_number}`,
          starts_at: new Date().toISOString(),
        });
      }
    }

    return new Response(JSON.stringify({ received: true }), {
      headers: { "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("[STRIPE WEBHOOK ERROR]", err instanceof Error ? err.message : String(err));
    return new Response(JSON.stringify({ error: "Webhook error" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
});
