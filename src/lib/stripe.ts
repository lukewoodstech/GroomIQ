import Stripe from "stripe";

if (!process.env.STRIPE_SECRET_KEY) {
  throw new Error("STRIPE_SECRET_KEY is not set");
}

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: "2025-11-17.clover",
  typescript: true,
});

// Pricing constants
export const PLANS = {
  FREE: {
    name: "Free",
    clientLimit: 10,
    price: 0,
  },
  PRO: {
    name: "Pro",
    clientLimit: Infinity,
    price: 10, // $10/month
    priceId: process.env.STRIPE_PRO_PRICE_ID!, // Set this in .env
  },
} as const;

// Helper to check if user can add more clients
export function canAddClient(currentClientCount: number, plan: string): boolean {
  const limit = plan === "pro" ? PLANS.PRO.clientLimit : PLANS.FREE.clientLimit;
  return currentClientCount < limit;
}

// Helper to get client limit for a plan
export function getClientLimit(plan: string): number {
  return plan === "pro" ? PLANS.PRO.clientLimit : PLANS.FREE.clientLimit;
}
