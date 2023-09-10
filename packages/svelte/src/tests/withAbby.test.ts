import "@testing-library/jest-dom";
import { findByText, render, waitFor } from "@testing-library/svelte";
import testPage from "./pages/+test.svelte";
import { abby } from "./abby";

import { HttpService } from "@tryabby/core";

describe("withabby working", () => {
  it("works properly", async () => {
    const data = await HttpService.getProjectData({
      projectId: "123",
    });
    if (!data) throw new Error("");
    abby.__abby__.init(data);

    const { getByText, queryByText } = render(testPage, {
      props: {
        data: {
          __abby__data: data,
          __abby_cookie: "",
        },
      },
    });
    const flag1 = await waitFor(() => getByText("my super secret feature 1"));
    expect(flag1).toBeInTheDocument();
    const remoteConfig1 = queryByText("my remoteConfig1 value");
    expect(remoteConfig1).not.toBeInTheDocument();
  });
});
