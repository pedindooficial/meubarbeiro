import Stripe from "stripe";

export const stripe = process.env.STRIPE_SECRET_KEY
  ? new Stripe(process.env.STRIPE_SECRET_KEY)
  : null;

export const PLANS = {
  free: {
    name: "Grátis",
    priceId: null,
    maxClients: 20,
    price: 0,
  },
  basic: {
    name: "Básico",
    priceId: process.env.STRIPE_PRICE_BASIC,
    maxClients: 150,
    price: 9.9,
  },
  premium: {
    name: "Premium",
    priceId: process.env.STRIPE_PRICE_PREMIUM,
    maxClients: -1,
    price: 29.9,
  },
} as const;
