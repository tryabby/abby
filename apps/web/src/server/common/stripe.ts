import { env } from "env/server.mjs";
import Stripe from "stripe";

if (process.browser)
  throw new Error(
    "DO NOT USE stripe/server.ts IN THE BROWSER AS YOU WILL EXPOSE FULL CONTROL OVER YOUR STRIPE ACCOUNT!"
  );

if (!env.STRIPE_SECRET_KEY)
  throw new Error("Please provide a STRIPE_SECRET_KEY environment variable!");

const stripe = new Stripe(env.STRIPE_SECRET_KEY, {
  // @ts-ignore The Stripe docs state that null denotes the Stripe account's default version and to use ts-ignore
  apiVersion: null,
});

export { stripe };
