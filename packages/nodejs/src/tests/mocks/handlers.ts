import { rest } from "msw";
import { type AbbyDataResponse, ABBY_BASE_URL } from "@tryabby/core";

export const handlers = [
  rest.get(`${ABBY_BASE_URL}api/v1/data/123`, (req, res, ctx) => {
    console.log("handler");
    return res(
      ctx.json({
        tests: [
          {
            name: "test",
            weights: [1, 1, 1, 1],
          },
          {
            name: "test2",
            weights: [1, 0],
          },
        ],
        flags: [
          {
            name: "flag1",
            value: true,
          },
          {
            name: "flag2",
            value: false,
          },
        ],
      } as AbbyDataResponse)
    );
  }),

  rest.get(`${ABBY_BASE_URL}api/dashboard/clfn3hs1t0002kx08x3kidi80/data`, (req, res, ctx) => {
    return res(
      ctx.json({
        tests: [
          {
            name: "test",
            weights: [1, 1, 1, 1],
          },
          {
            name: "test2",
            weights: [1, 0],
          },
        ],
        flags: [
          {
            name: "lol",
            value: true,
          },
          {
            name: "test3",
            value: false,
          },
        ],
      } as AbbyDataResponse)
    );
  }),
];
