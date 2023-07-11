import express, { Request } from "express";
import { abbyMiddlewareFactory } from "./express/abbyMiddlewareFactory";

const app = express();
const port = 3000;

const { featureFlagMiddleware, allTestsMiddleWare, getVariant } = abbyMiddlewareFactory({
  abbyConfig: {
    projectId: "clfn3hs1t0002kx08x3kidi80",
    currentEnvironment: process.env.NODE_ENV,
    tests: {
      "New Test3": {
        variants: ["A", "B"],
      },
      "New Test6": {
        variants: ["A"],
      },
    },
    flags: {
      lol: "Boolean",
      test3: "Boolean",
      testAbby: "Boolean",
    },
    flagCacheConfig: {
      refetchFlags: true,
      timeToLive: 1,
    },
  },
});

app.use(express.json());

app.use("/", (req, res, next) => {
  console.log(req.body);
  allTestsMiddleWare(req, res, next);
});

const deciderFunc = (req: Request, flagVal: any) => {
  const countryOfOrigin = req.body.country;
  if (!countryOfOrigin) return false;
  const decision = flagVal.enabledCountries === countryOfOrigin;
  console.log("acces granted");
  return decision;
};

app.use("/", (req, res, next) => featureFlagMiddleware("test3", req, res, next));

app.get("/", async (req, res) => {
  const variant = getVariant("New Test3");
  res.send(variant === "B" ? "very nice content that needs to be protected" : "vriant B");
});

app.listen(port, () => console.log(`Express app running on port ${port}!`));
