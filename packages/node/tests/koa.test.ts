import Koa from "koa";
import { Server } from "http";
import { createAbbyMiddleWare } from "../src/koa";
import { ABBY_AB_STORAGE_PREFIX } from "@tryabby/core";
import fetch from "node-fetch";

const app = new Koa();
const PORT = 5556;
const SERVER_URL = `http://localhost:${PORT}`;

let server: Server | undefined = undefined;

const testVariants = ["OldFooter", "NewFooter"] as const;
const test2Variants = ["SimonsText", "MatthiasText", "TomsText", "TimsText"] as const;

const { middleware, abby } = createAbbyMiddleWare({
  environments: [],
  projectId: "123",
  tests: {
    test: { variants: testVariants },
    test2: {
      variants: test2Variants,
    },
  },
  flags: ["flag1", "flag2"],
});

app.use(middleware);

app.use((ctx) => {
  if (ctx.method === "GET" && ctx.path === "/") {
    const flag1 = abby.getFeatureFlag("flag1");
    const flag2 = abby.getFeatureFlag("flag2");
    ctx.res.setHeader("Content-Type", "application/json");
    ctx.body = JSON.stringify({
      flag1,
      flag2,
    });
  }
  if (ctx.method === "GET" && ctx.path === "/test") {
    const test = abby.getTestVariant("test");
    const test2 = abby.getTestVariant("test2");
    ctx.res.setHeader("Content-Type", "application/json");
    ctx.body = JSON.stringify({
      test,
      test2,
    });
  }
});

beforeAll(async () => {
  server = app.listen(PORT);
});

afterAll(() => {
  server?.close();
});

it("should work with feature flags", async () => {
  const data = await fetch(`${SERVER_URL}`).then((r) => r.json());
  expect(data).toEqual({
    flag1: true,
    flag2: false,
  });
});

it("should work with A/B tests", async () => {
  const data = (await fetch(`${SERVER_URL}/test`).then((r) => r.json())) as {
    test: string;
    test2: string;
  };

  expect(data.test).to.be.oneOf(testVariants);
  expect(data.test2).to.be.oneOf(test2Variants);
});

it("should work with a cookie seed", async () => {
  const data = (await fetch(`${SERVER_URL}/test`, {
    headers: {
      cookie: `${ABBY_AB_STORAGE_PREFIX}${abby.getConfig().projectId}_test=${
        testVariants[0]
      };${ABBY_AB_STORAGE_PREFIX}${abby.getConfig().projectId}_test2=${test2Variants[2]}`,
    },
  }).then((r) => r.json())) as {
    test: string;
    test2: string;
  };

  expect(data.test).toEqual(testVariants[0]);
  expect(data.test2).toEqual(test2Variants[2]);
});
