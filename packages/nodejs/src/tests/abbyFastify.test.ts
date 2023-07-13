import { expect, test, describe, beforeAll } from "vitest";
import Fastify, { FastifyInstance } from "fastify";
import { abbyFastifyFactory } from "../fastify/fastifyHookFactory";
import request from "supertest";
import fastifyCookie from "@fastify/cookie";

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

    // Register the fastify-cookie plugin
    fastify.register(fastifyCookie);

    fastify.addHook("onRequest", (request, reply, done) => {
      ABTestHook(request, reply, done);
    });

    fastify.get("/fastify", function (request, reply) {
      reply.send("Hello world!");
    });
    fastify.get("/cookie/Set", (request, reply) => {
      const variant = getTestValue("test", { req: request, res: reply });
      reply.send(variant);
    });
    fastify.get("/cookie/notSet", (request, reply) => {
      const variant = getTestValue("test2", { req: request, res: reply });
      reply.send(variant);
    });
  });

  test("featureFlag middleware", async () => {
    await fastify.ready();
    const res = await request(fastify.server).get("/fastify");
  });

  test("abTestMiddleware respects the set cookie", async () => {
    const cookieVariant = "D";
    //test cookie retrieval
    const response = await request(fastify.server)
      .get("/cookie/Set")
      .set("Cookie", [`__abby__ab__123_test=${cookieVariant}`]);

    expect(response.text).toBe(cookieVariant);
  });

  test("abTestMiddleware sets the right cookie", async () => {
    const res = await request(fastify.server).get("/cookie/notSet");
    const cookies = res.headers["set-cookie"]; //res headers is any so need to be carefull
    expect(cookies[0]).toBe("__abby__ab__123_test2=A");
  });
});
