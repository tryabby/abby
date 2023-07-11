import { expect, test, describe, beforeAll } from "vitest";
import Fastify, { FastifyInstance } from "fastify";
import { abbyFastifyFactory } from "../fastify/fastifyHookFactory";
import request from "supertest";

describe("fastify working", () => {
  let fastify: FastifyInstance;
  beforeAll(() => {
    const { getTestValue, ABTestHook } = abbyFastifyFactory({
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

    fastify = Fastify();

    // fastify.register(require("@fastify/cookie"), {
    //   secret: "my-secret", // for cookies signature
    //   hook: "onRequest", // set to false to disable cookie autoparsing or set autoparsing on any of the following hooks: 'onRequest', 'preParsing', 'preHandler', 'preValidation'. default: 'onRequest'
    //   parseOptions: {}, // options for parsing cookies
    // });

    // fastify.addHook("onRequest", (request, reply, done) => {
    //   ABTestHook(request, reply, done);
    // });

    fastify.get("/", function (request, reply) {
      reply.send("Hello world!");
    });
    fastify.get("/cookie/notSet", (request, reply) => {
      const variant = getTestValue("test2");
      reply.send(variant);
    });
  });

  test("featureFlag middleware", async () => {
    await fastify.ready();
    const res = await request(fastify.server).get("/");
    console.log(res.statusCode);
  });

  //   test("abTestMiddleware respects the set cookie", async () => {
  //     const cookieVariant = "D";
  //     //test cookie retrieval
  //     const response = await request(fastify.server)
  //       .get("/cookie/notSet")
  //       .set("Cookie", [`__abby__ab__123_test2=${cookieVariant}; Path=/`]);

  //     expect(response.text).toBe(cookieVariant);
  //   });

  //   test("abTestMiddleware sets the right cookie", async () => {
  //     const res = await request(fastify.server).get("/cookie/notSet");
  //     console.log("response:", res.text);
  //     const cookies = res.headers["set-cookie"]; //res headers is any so need to be carefull
  //     console.log(cookies);
  //     expect(cookies[1]).toBe("__abby__ab__123_test2=A; Path=/");
  //   });
});
