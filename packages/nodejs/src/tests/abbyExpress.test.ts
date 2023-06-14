import { expect, test, describe, beforeEach } from "vitest";
import express from "express";
import request, { Response, Request } from "supertest";
import { abbyMiddlewareFactory } from "../express/abbyMiddlewareFactory.ts";
import { A } from "ts-toolbelt";

describe("express middleware working", () => {
  let app: express.Application;

  beforeEach(async () => {
    const { AbTestMiddleware, featureFlagMiddleware } = await abbyMiddlewareFactory({
      abbyConfig: {
        projectId: "123",
        currentEnvironment: process.env.NODE_ENV,
        tests: {
          test: {
            variants: ["A", "B", "C", "D"],
          },
          test2: {
            variants: ["A", "B"],
          },
        },
        flags: ["flag1", "flag2"],
      },
    });

    app = express();
    // Add any other middlewares or routes necessary for your test
    app.use("/featureFlagEnabled", (req, res, next) =>
      featureFlagMiddleware("flag1", req, res, next)
    );
    app.use("/featureFlagDisabled", (req, res, next) =>
      featureFlagMiddleware("flag2", req, res, next)
    );
    app.get("/featureFlagEnabled", (req, res) => res.send(""));
    app.get("/featureFlagDisabled", (req, res) => res.send(""));

    app.use("/cookieNeedToBeSet", (req, res, next) => AbTestMiddleware("test2", req, res, next));
    app.get("/cookieSet", (req, res) => {
      res.send("hiadsa");
    });
  });

  test.skip("abTestMiddleware respects the set cookie", async () => {
    //test cookie retrieval
  });

  test("abTestMiddleware sets the right cookie", async () => {
    const res = await request(app).get("/cookieNeedToBeSet");
    const cookies = res.headers["set-cookie"]; //res headers is any so need to be carefull
    expect(cookies[0]).toBe("__abby__ab__123_test2=A; Path=/");
  });

  test.skip("featureFlag Middleware working", async () => {
    //check if feature flag value is respected

    const succesFullResponse = await request(app).get("/featureFlagEnabled");
    const forbiddenResponse = await request(app).get("/featureFlagDisabled");
    expect(succesFullResponse.statusCode).toBe(200);
    expect(forbiddenResponse.statusCode).toBe(403);
  });
});
