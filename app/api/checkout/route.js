import Stripe from "stripe";

export const runtime = "nodejs";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

export async function POST(req) {
  const { userId } = await req.json();

  const session = await stripe.checkout.sessions.create({
    mode: "subscription",
    line_items: [{ price: process.env.STRIPE_PRICE_ID, quantity: 1 }],
    subscription_data: {
      trial_period_days: 7,
      metadata: { user_id: userId }
    },
    metadata: { user_id: userId },
    success_url: process.env.NEXT_PUBLIC_URL + "/quiz",
    cancel_url: process.env.NEXT_PUBLIC_URL
  });

  return Response.json({ url: session.url });
}