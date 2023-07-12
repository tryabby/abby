import Fastify from "fastify";
import { abbyFastifyFactory } from "./fastifyHookFactory";
import fastifyCookie, { FastifyCookieOptions } from "@fastify/cookie";

const fastify = Fastify();

// Register the fastify-cookie plugin
fastify.register(fastifyCookie);

const setCookie = fastifyCookie;

console.log(setCookie);

const { featureFlagHook, ABTestHook, getTestValue } = abbyFastifyFactory({
  abbyConfig: {
    projectId: "clfn3hs1t0002kx08x3kidi80",
    currentEnvironment: process.env.NODE_ENV,
    tests: {
      "New Test3": {
        variants: ["A", "B"],
      },
      "New Test6": {
        variants: ["A", "GG"],
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

fastify.addHook("onRequest", (request, reply, done) => {
  ABTestHook(request, reply, done);
  // featureFlagHook("lol", request, reply, done);
});

const port = 3000;
console.log("start fastify");
fastify.get("/", function (request, reply) {
  // setResponse(reply);
  const variant = getTestValue("New Test3");
  const variant2 = getTestValue("New Test6");
  console.log("reply before send", reply.getHeaders());
  reply.send("hi");
});

fastify.listen({ port }, function (err, address) {
  if (err) {
    fastify.log.error(err);
    process.exit(1);
  }

  fastify.log.info(`Fastify is listening on port: ${address}`);
});
