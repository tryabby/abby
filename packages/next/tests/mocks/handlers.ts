import { rest } from "msw";
import { AbbyDataResponse, ABBY_BASE_URL } from "@tryabby/core";

const returnData: AbbyDataResponse = {
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
  remoteConfig: [
    {
      name: "remoteConfig1",
      value: "FooBar",
    },
  ],
};
export const handlers = [
  rest.get(`${ABBY_BASE_URL}api/dashboard/:projectId/data`, (req, res, ctx) => {
    return res(ctx.json(returnData));
  }),
  rest.get(`${ABBY_BASE_URL}api/v1/data/:projectId`, (req, res, ctx) => {
    return res(ctx.json(returnData));
  }),
];
