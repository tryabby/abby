export async function register() {
  if (process.env.NEXT_RUNTIME === "nodejs") {
    console.log("Registering workers...");

    const workers = await Promise.all([
      import("server/queue/AfterDataRequest"),
      import("server/queue/event"),
    ]);

    if (process.env.NEXT_RUNTIME === "nodejs") {
      await import("../sentry.server.config");
    }

    // biome-ignore lint/suspicious/noExplicitAny: typings are off
    if (process.env.NEXT_RUNTIME === ("edge" as any)) {
      await import("../sentry.edge.config");
    }

    const gracefulShutdown = async (signal: string) => {
      console.log(`Received ${signal}, closing server...`);
      await Promise.all(workers.map((w) => w.default.close()));
      // Other asynchronous closings
      process.exit(0);
    };

    process.on("SIGINT", () => gracefulShutdown("SIGINT"));

    process.on("SIGTERM", () => gracefulShutdown("SIGTERM"));
  }
}
