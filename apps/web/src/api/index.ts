import { makeConfigRoute } from "api/routes/v1_config";
import { makeProjectDataRoute } from "api/routes/v1_project_data";
import { Hono } from "hono";
import { cors } from "hono/cors";
import { makeHealthRoute } from "./routes/health";
import { makeIntegrationsRoute } from "./routes/integrations";
import { makeLegacyProjectDataRoute } from "./routes/legacy_project_data";
import { makeEventRoute } from "./routes/v1_event";

export const app = new Hono()
  .basePath("/api")
  // base middleware

  .use("*", cors({ origin: "*", maxAge: 86400 }))
  .route("/health", makeHealthRoute())
  // legacy routes
  .route("/data", makeEventRoute())
  .route("/dashboard", makeLegacyProjectDataRoute())
  // v1 routes
  .route("/v1/config", makeConfigRoute())
  .route("/v1/data", makeProjectDataRoute())
  .route("/v1/track", makeEventRoute())
  .route("/integrations", makeIntegrationsRoute());
