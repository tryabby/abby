import Fastify from "fastify";
import { parseCookies } from "../shared/helpers";
import { abby } from "./createAbby";
import { setRequest, getRequest } from "../abby/contexts/requestContext";
import { setResponse } from "../abby/contexts/responseContext";

const fastify = Fastify();

fastify.register(require("@fastify/cookie"), {
  secret: "my-secret", // for cookies signature
  hook: "onRequest", // set to false to disable cookie autoparsing or set autoparsing on any of the following hooks: 'onRequest', 'preParsing', 'preHandler', 'preValidation'. default: 'onRequest'
  parseOptions: {}, // options for parsing cookies
});

const port = 3000;
console.log("start fastify");
fastify.get("/", function (request, reply) {
  console.log(parseCookies(request));
  setRequest(request);
  setResponse(reply);
  console.log(abby.getABTestValue("New Test3"));
  reply.send("Hello world!");
});

fastify.listen({ port }, function (err, address) {
  if (err) {
    fastify.log.error(err);
    process.exit(1);
  }

  fastify.log.info(`Fastify is listening on port: ${address}`);
});
