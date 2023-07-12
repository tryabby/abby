import { expect, test, describe, beforeAll } from "vitest";
import express from "express";
import request from "supertest";
import { abbyMiddlewareFactory } from "../express/abbyMiddlewareFactory";

describe("express middleware working", () => {
  let app: express.Application;

  beforeAll(async () => {
    const { allTestsMiddleWare, featureFlagMiddleware, getVariant } = await abbyMiddlewareFactory({
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
        flags: {
          flag1: "String",
          flag2: "Boolean",
        },
      },
    });

    app = express();
    // Add any other middlewares or routes necessary for your test
    app.use("/featureFlag/Enabled", (req, res, next) =>
      featureFlagMiddleware("flag1", req, res, next)
    );
    app.use("/featureFlag/Disabled", (req, res, next) =>
      featureFlagMiddleware("flag2", req, res, next)
    );
    app.get("/featureFlag/Enabled", (req, res) => res.send(""));
    app.get("/featureFlag/Disabled", (req, res) => res.send(""));

    app.use("/cookie", (req, res, next) => allTestsMiddleWare(req, res, next));
    app.get("/cookie/notSet", (req, res) => {
      const variant = getVariant("test2");
      if (variant) {
        res.send(variant);
        return;
      }
      res.sendStatus(404);
    });
    app.get("/cookie/Set", (req, res) => {
      res.send("hiadsa");
    });
  });

  //TODO for whatever reason middleware tests need to be executed first, else it does not work
  test("featureFlag Middleware working", async () => {
    //check if feature flag value is respected

    const succesFullResponse = await request(app).get("/featureFlag/Enabled");
    const forbiddenResponse = await request(app).get("/featureFlag/Disabled");
    expect(succesFullResponse.statusCode).toBe(200);
    expect(forbiddenResponse.statusCode).toBe(403);
  });
  test("abTestMiddleware respects the set cookie", async () => {
    const cookieVariant = "D";
    //test cookie retrieval
    const response = await request(app)
      .get("/cookie/notSet")
      .set("Cookie", [`__abby__ab__123_test2=${cookieVariant}; Path=/`]);

    expect(response.text).toBe(cookieVariant);
  });

  test("abTestMiddleware sets the right cookie", async () => {
    const res = await request(app).get("/cookie/Set");
    const cookies = res.headers["set-cookie"]; //res headers is any so need to be carefull
    expect(cookies[0]).toBe("__abby__ab__123_test2=A");
  });
});
