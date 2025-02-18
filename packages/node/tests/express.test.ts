import { ABBY_AB_STORAGE_PREFIX } from "@tryabby/core";
import express from "express";
import request from "supertest";
import { createAbbyMiddleWare } from "../src/express";

const app = express();

const testVariants = ["OldFooter", "NewFooter"] as const;
const test2Variants = [
  "SimonsText",
  "MatthiasText",
  "TomsText",
  "TimsText",
] as const;

const { middleware, abby } = createAbbyMiddleWare({
  currentEnvironment: "development",
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

app.get("/", middleware, (_req, res) => {
  const flag1 = abby.getFeatureFlag("flag1");
  const flag2 = abby.getFeatureFlag("flag2");
  res.json({
    flag1,
    flag2,
  });
});

app.get("/fail", (_req, res) => {
  const flag1 = abby.getFeatureFlag("flag1");
  const flag2 = abby.getFeatureFlag("flag2");
  res.json({
    flag1,
    flag2,
  });
});

app.get("/test", middleware, (_req, res) => {
  const test = abby.getTestVariant("test");
  const test2 = abby.getTestVariant("test2");
  res.json({
    test,
    test2,
  });
});

it.skip("should work with feature flags", async () => {
  const res = await request(app).get("/");
  expect(res.body).toEqual({
    flag1: true,
    flag2: false,
  });
});

it("should work with A/B tests", async () => {
  const res = await request(app).get("/test");
  expect(res.body.test).to.be.oneOf(testVariants);
  expect(res.body.test2).to.be.oneOf(test2Variants);
});

it("should work with a cookie seed", async () => {
  const res = await request(app)
    .get("/test")
    .set(
      "Cookie",
      `${ABBY_AB_STORAGE_PREFIX}${abby.getConfig().projectId}_test=${
        testVariants[0]
      };${ABBY_AB_STORAGE_PREFIX}${abby.getConfig().projectId}_test2=${test2Variants[2]}`
    );

  expect(res.body.test).toEqual(testVariants[0]);
  expect(res.body.test2).toEqual(test2Variants[2]);
});
