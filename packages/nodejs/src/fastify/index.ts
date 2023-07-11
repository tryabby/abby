import Fastify from "fastify";

const fastify = Fastify();

const port = 3000;
console.log("start fastify");
fastify.get("/", function (request, reply) {
  reply.send("Hello world!");
});

fastify.listen({ port }, function (err, address) {
  if (err) {
    fastify.log.error(err);
    process.exit(1);
  }

  fastify.log.info(`Fastify is listening on port: ${address}`);
});
