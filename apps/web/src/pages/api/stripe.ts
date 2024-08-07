import dayjs from "dayjs";
import { env as serverEnv } from "env/server.mjs";
import { buffer } from "micro";
import type { NextApiRequest, NextApiResponse } from "next";
import { stripe } from "server/common/stripe";
import { prisma } from "server/db/client";
import { RequestCache } from "server/services/RequestCache";
import type Stripe from "stripe";

const secondsToMsDate = (seconds: number) => new Date(seconds * 1000);

// Replace this endpoint secret with your endpoint's unique secret
// If you are testing with the CLI, find the secret by running 'stripe listen'
// If you are using an endpoint defined with the API or dashboard, look in your webhook settings
// at https://dashboard.stripe.com/webhooks
const endpointSecret = serverEnv.STRIPE_WEBHOOK_SECRET;

interface StripeSession {
  id: string;
  customer: string;
  current_period_end: number;
  metadata: {
    projectId: string;
  };
  subscription: string;
  items: {
    data: {
      price: {
        id: string;
      };
    }[];
  };
}

export default async function handleStripeWebhook(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const sig = req.headers["stripe-signature"];

  if (!sig) {
    return res.status(400).send("Webhook Error: Missing signature");
  }

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(
      await buffer(req),
      sig,
      endpointSecret
    );
  } catch (err) {
    console.error(err);
    // On error, log and return the error message
    console.log(
      `❌ Error message: ${err instanceof Error ? err.message : err}`
    );
    return res
      .status(400)
      .send(`Webhook Error: ${err instanceof Error ? err.message : err}`);
  }

  const session = event.data?.object as StripeSession;

  // Handle the event
  switch (event.type) {
    case "checkout.session.completed": {
      const subscription = await stripe.subscriptions.retrieve(
        session.subscription
      );

      await RequestCache.reset(session.metadata.projectId);

      await prisma.project.update({
        where: {
          id: session.metadata.projectId,
        },
        data: {
          currentPeriodEnd: secondsToMsDate(subscription.current_period_end),
          stripeSubscriptionId: subscription.id,
          stripeCustomerId: session.customer,
          stripePriceId: subscription.items.data[0]?.price.id,
        },
      });
      break;
    }
    case "customer.subscription.deleted": {
      await prisma.project.update({
        where: {
          stripeSubscriptionId: session.id,
        },
        data: {
          currentPeriodEnd: dayjs().add(30, "days").toISOString(),
          stripePriceId: null,
        },
      });
      break;
    }
    default: {
      // Unexpected event type
      console.log(`Unhandled event type ${event.type}.`);
    }
  }

  // Return a 200 response to acknowledge receipt of the event
  res.end();
}

export const config = {
  api: {
    bodyParser: false,
  },
};
