import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2";
import Stripe from "npm:stripe@17.2.0";

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
    const stripeKey = Deno.env.get("STRIPE_SECRET_KEY");
    const baseUrl = Deno.env.get("SUPABASE_URL")!;

    if (!stripeKey) {
      return new Response(JSON.stringify({
        error: "Stripe n'est pas configuré. Ajoutez STRIPE_SECRET_KEY.",
        configured: false,
      }), {
        status: 503,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const stripe = new Stripe(stripeKey);
    const supabase = createClient(baseUrl, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);

    const body = await req.json() as {
      userId: string;
      productId: string;
      successUrl: string;
      cancelUrl: string;
    };

    if (!body.userId || !body.productId) {
      return new Response(JSON.stringify({ error: "userId et productId requis" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { data: product } = await supabase
      .from("products")
      .select("*")
      .eq("id", body.productId)
      .eq("is_active", true)
      .maybeSingle();

    if (!product) {
      return new Response(JSON.stringify({ error: "Produit introuvable" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    let priceId = product.external_price_id;

    if (!priceId) {
      const price = await stripe.prices.create({
        unit_amount: Math.round(Number(product.price) * 100),
        currency: product.currency.toLowerCase(),
        product_data: {
          name: product.name,
        },
      });
      priceId = price.id;

      await supabase
        .from("products")
        .update({ external_price_id: priceId })
        .eq("id", product.id);
    }

    const { data: order } = await supabase
      .from("orders")
      .insert({
        user_id: body.userId,
        status: "pending",
        total_amount: product.price,
        currency: product.currency,
        payment_provider: "stripe",
      })
      .select()
      .single();

    if (!order) {
      return new Response(JSON.stringify({ error: "Échec création commande" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    await supabase.from("order_items").insert({
      order_id: order.id,
      product_id: product.id,
      resource_type: product.type,
      resource_id: product.resource_id,
      unit_price: product.price,
      quantity: 1,
      total_price: product.price,
    });

    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      line_items: [{ price: priceId, quantity: 1 }],
      success_url: body.successUrl,
      cancel_url: body.cancelUrl,
      metadata: {
        order_id: order.id,
        user_id: body.userId,
        product_id: product.id,
        resource_type: product.type,
        resource_id: product.resource_id,
      },
    });

    await supabase
      .from("orders")
      .update({ external_payment_id: session.id })
      .eq("id", order.id);

    return new Response(JSON.stringify({
      configured: true,
      checkoutUrl: session.url,
      sessionId: session.id,
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("[STRIPE CHECKOUT ERROR]", err instanceof Error ? err.message : String(err));
    return new Response(JSON.stringify({ error: "Erreur lors de la création du paiement" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
