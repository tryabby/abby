import "@testing-library/jest-dom";
import { findByText, render, waitFor } from "@testing-library/svelte";
import testPage from "./pages/+test.svelte";
import { abby } from "./abby";

import { HttpService } from "shared";

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
    const flag2 = queryByText("my super secret feature 2");
    expect(flag2).not.toBeInTheDocument();
  });
});
