import { makeConfigRoute } from "api/routes/v1_config";
import { makeProjectDataRoute } from "api/routes/v1_project_data";
import { Hono } from "hono";
import { cors } from "hono/cors";
import { logger } from "hono/logger";
import { makeHealthRoute } from "./routes/health";
import { makeEventRoute } from "./routes/v1_event";
import { makeLegacyProjectDataRoute } from "./routes/legacy_project_data";

export function bootstrapApi() {
  const app = new Hono().basePath("/api");

  // base middleware
  app.use("*", logger());
  app.use("*", cors({ origin: "*", maxAge: 86400 }));

  app.route("/health", makeHealthRoute());

  // legacy routes
  app.route("/data", makeEventRoute());
  app.route("/dashboard", makeLegacyProjectDataRoute());

  // v1 routes
  app.route("/v1/config", makeConfigRoute());
  app.route("/v1/data", makeProjectDataRoute());
  app.route("/v1/track", makeEventRoute());

  return app;
}
