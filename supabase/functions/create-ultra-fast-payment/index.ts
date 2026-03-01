// Supabase Edge Function: Ultra-Fast Payment (Deno)
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

serve(async (req) => {
  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers: { "Content-Type": "application/json" },
    });
  }

  try {
    const body = await req.json();
    const { productId, buyerId, productPrice, productTitle, sellerId } = body;

    if (!productId || !buyerId || !productPrice || !productTitle || !sellerId) {
      return new Response(JSON.stringify({ error: "Missing required fields" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Generate order ID
    const orderId = `ORD-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`;

    // Create payment via Cryptomus API
    const paymentResponse = await fetch("https://api.cryptomus.com/v1/payment", {
      method: "POST",
      headers: {
        "merchant": Deno.env.get("CRYPTOMUS_MERCHANT_ID"),
        "sign": Deno.env.get("CRYPTOMUS_API_KEY"),
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        amount: productPrice,
        currency: "USD",
        order_id: orderId,
        url_success: `https://seltech.online/order-success?order=${orderId}`,
        url_failed: "https://seltech.online/marketplace",
        description: productTitle,
        lifetime: 600,
        payer_email: buyerId // You may want to pass actual email if available
      }),
    });
    const paymentResult = await paymentResponse.json();
    const widgetUrl = paymentResult.result?.url || "";

    // Return widget URL and order ID
    return new Response(
      JSON.stringify({
        success: !!widgetUrl,
        orderId,
        widgetUrl,
        error: widgetUrl ? undefined : paymentResult.message || "Failed to create payment",
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message || "Payment creation failed" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
});
