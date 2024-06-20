export async function register() {
  if (process.env.NEXT_RUNTIME === "nodejs") {
    console.log("Registering workers...");

    await Promise.all([
      import("server/queue/AfterDataRequest"),
      import("server/queue/event"),
    ]);
  }
}
