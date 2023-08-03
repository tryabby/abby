import { loadStripe } from "@stripe/stripe-js";
import { env } from "env/client.mjs";
import { trpc } from "utils/trpc";
import { Project } from "@prisma/client";
import { PlanName, PLANS } from "server/common/plans";

export const useAbbyStripe = () => {
  const { mutateAsync: createCheckoutSession } =
    trpc.project.createStripeCheckoutSession.useMutation();
  const { mutateAsync: createBillingPortalUrl } =
    trpc.project.createStripeBillingPortalUrl.useMutation();

  const redirectToCheckout = (projectId: string, plan: PlanName) =>
    Promise.all([
      loadStripe(env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY),
      createCheckoutSession({
        plan,
        projectId,
      }),
    ]).then(([stripe, sessionId]) => {
      if (!stripe || !sessionId) return;

      stripe.redirectToCheckout({
        sessionId,
      });
    });

  const redirectToBillingPortal = async (projectId: string) => {
    const url = await createBillingPortalUrl({ projectId });
    if (!url) return;
    window.location.assign(url);
  };
  return { redirectToBillingPortal, redirectToCheckout };
};

const MILLISECONDS_IN_A_DAY = 86_400_000;

export const BETA_PRICE_ID = "BETA";

export const isBetaPlan = (project: Project) =>
  project.stripePriceId === BETA_PRICE_ID;
/**
 * @returns the project's paid plan or null if the project is a free one
 *
 * @example
 * ```ts
 * const project = await prisma.project.findFirst(...)
 * const plan = getProjectPaidPlan(project)
 * ```
 */
export const getProjectPaidPlan = <T extends Project>(project: T | null) => {
  // beta plans last for ever and have special rules
  if (project !== null && isBetaPlan(project)) return BETA_PRICE_ID;

  if (
    !project ||
    !project.stripePriceId ||
    !project.currentPeriodEnd ||
    // We give projects a grace period of 24 hours to pay their invoices
    project.currentPeriodEnd.getTime() + MILLISECONDS_IN_A_DAY < Date.now()
  ) {
    return null;
  }

  const plan = Object.keys(PLANS).find(
    (plan) => PLANS[plan as PlanName] === project.stripePriceId
  );

  return (plan as PlanName) ?? null;
};
