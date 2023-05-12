import { loadStripe } from "@stripe/stripe-js";
import { CodeSnippet } from "components/CodeSnippet";
import { env } from "env/client.mjs";
import { getFeatureFlagValue, useAbby, useFeatureFlag } from "lib/abby";
import { trpc } from "utils/trpc";

function InnerApp() {
  // const showFooter = useFeatureFlag("Show Footer");
  // const showPrices = useFeatureFlag("Show Prices");
  const useDarkmode = useFeatureFlag("test");
  const { variant } = useAbby("SignupButton");

  const { mutateAsync } =
    trpc.project.createStripeCheckoutSession.useMutation();

  const redirectToCheckout = () => {
    Promise.all([
      loadStripe(env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY),
      mutateAsync({
        plan: "STARTER",
        projectId: "clbg4nnyb0000mfx94qo1jo0w",
      }),
    ]).then(([stripe, sessionId]) => {
      if (!stripe || !sessionId) return;

      stripe.redirectToCheckout({
        sessionId,
      });
    });
  };

  return (
    <main className="p-6">
      <h1>Abby Test Page:</h1>

      <h1>Code:</h1>
      <CodeSnippet projectId="clbg4nnyb0000mfx94qo1jo0w" />

      <button onClick={redirectToCheckout}>Checkout</button>
      <p>Current Environment: {process.env.NODE_ENV}</p>
      {/* <p>Show Footer: {showFooter ? "Enabled" : "Disabled"}</p>
      <p>Show Prices: {showPrices ? "Enabled" : "Disabled"}</p> */}
      <p>Use Darkmode: {useDarkmode ? "Enabled" : "Disabled"}</p>
      <p>
        Current Variant:
        {variant === "A" && "A"}
        {variant === "B" && "B"}
      </p>
    </main>
  );
}
function TestPage(props: any) {
  return (
    <>
      <pre>{JSON.stringify(props, null, 2)}</pre>
      <InnerApp />
    </>
  );
}

export const getStaticProps = async () => {
  return {
    props: {
      a: getFeatureFlagValue("showFooter"),
    },
  };
};

export default TestPage;
