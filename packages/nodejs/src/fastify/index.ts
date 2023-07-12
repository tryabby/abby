import Fastify from "fastify";
import { parseCookies } from "../shared/helpers";
import { abby } from "./createAbby";
import { setRequest, getRequest } from "../abby/contexts/requestContext";
import { setResponse } from "../abby/contexts/responseContext";
import { abbyFastifyFactory } from "./fastifyHookFactory";

const fastify = Fastify();

fastify.register(require("@fastify/cookie"), {
  secret: "my-secret", // for cookies signature
  hook: "onRequest", // set to false to disable cookie autoparsing or set autoparsing on any of the following hooks: 'onRequest', 'preParsing', 'preHandler', 'preValidation'. default: 'onRequest'
  parseOptions: {}, // options for parsing cookies
});

const { featureFlagHook } = abbyFastifyFactory({
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

fastify.addHook("onRequest", async (request, reply, done) => {
  console.log("hook");
  featureFlagHook("lol", request, reply, done);
});

const port = 3000;
console.log("start fastify");
fastify.get("/", function (request, reply) {
  setRequest(request);
  setResponse(reply);
  reply.send("Hello world!");
});

fastify.listen({ port }, function (err, address) {
  if (err) {
    fastify.log.error(err);
    process.exit(1);
  }

  fastify.log.info(`Fastify is listening on port: ${address}`);
});
