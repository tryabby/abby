import { rest } from "msw";
import { ABBY_BASE_URL } from "@tryabby/core";

export const handlers = [
  rest.get(`${ABBY_BASE_URL}/api/v1/config/:projectId`, (req, res, ctx) => {
    const apiKey = req.url.searchParams.get("apiKey");

    if (apiKey == "test") {
      return res(
        ctx.json({
          projectId: "test",
          tests: {
            test1: {
              variants: ["A", "B", "C", "D"],
            },
            test2: {
              variants: ["A", "B"],
            },
          },
          flags: ["flag1", "flag2"],
        })
      );
    } else {
      return res(
        ctx.json({
          projectId: "test",
          tests: {
            test1: {
              variants: ["A", "B", "C", "D"],
            },
            test2: {
              variants: ["A", "B"],
            },
            test3: {
              variants: ["A", "B", "C", "D"],
            },
          },
          flags: ["flag1", "flag2", "flag3"],
        })
      );
    }
  }),
  rest.put(`${ABBY_BASE_URL}api/v1/config/:projectId`, (req, res, ctx) => {
    return res(ctx.json({ message: "Config updated" }));
  }),
];
