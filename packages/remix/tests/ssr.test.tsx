import { json } from "@remix-run/node";
import { useLoaderData } from "@remix-run/react";
import { createRemixStub } from "@remix-run/testing";
import { render, screen, waitFor } from "@testing-library/react";
import { createAbby } from "../src";

test("renders loader data", async () => {
  const { AbbyProvider, useFeatureFlag, getAbbyData } = createAbby({
    currentEnvironment: "",
    environments: [],
    projectId: "123",
    flags: ["flag1", "flag2"],
  });

  function MyComponent() {
    const flag1 = useFeatureFlag("flag1");
    const flag2 = useFeatureFlag("flag2");
    return (
      <div>
        <p>Flag 1 is {flag1 ? "on" : "off"}</p>
        <p>Flag 2 is {flag2 ? "on" : "off"}</p>
      </div>
    );
  }

  const RemixStub = createRemixStub([
    {
      path: "/",
      Component: () => (
        <AbbyProvider>
          <MyComponent />
        </AbbyProvider>
      ),
      async loader(ctx) {
        return json({ ...(await getAbbyData(ctx)) });
      },
    },
  ]);

  render(<RemixStub />);

  await waitFor(() => screen.findByText("Flag 1 is on"));
  await waitFor(() => screen.findByText("Flag 2 is off"));
});
