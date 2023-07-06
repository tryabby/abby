import express from "express";
import { abbyMiddlewareFactory } from "./express/abbyMiddlewareFactory.ts";
import { createAbby } from "./abby/createAbby.ts";

const app = express();
const port = 3000;

const { featureFlagMiddleware, allTestsMiddleWare, getVariant } = await abbyMiddlewareFactory({
  abbyConfig: {
    projectId: "clfn3hs1t0002kx08x3kidi80",
    currentEnvironment: process.env.NODE_ENV,
    tests: {
      "New Test3": {
        variants: ["A", "B"],
      },
      Test2: {
        variants: ["A", "klein", "basic"],
      },
      "New Test6": {
        variants: ["A"],
      },
    },
    flags: ["lol", "test3", "testAbby"],
    flagCacheConfig: {
      refetchFlags: true,
      timeToLive: 1,
    },
  },
});

app.use("/", (req, res, next) => allTestsMiddleWare(req, res, next));

// app.use("/", (req, res, next) => featureFlagMiddleware("test3", req, res, next));

app.get("/", async (req, res) => {
  const variant = getVariant("New Test3");
  res.send(variant === "A" ? "very nice content that needs to be protected" : "vriant B");
});

app.listen(port, () => console.log(`Express app running on port ${port}!`));
