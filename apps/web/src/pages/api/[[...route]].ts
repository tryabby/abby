import { handle } from "@hono/node-server/vercel";
import { bootstrapApi } from "api";

const app = bootstrapApi();

export default handle(app);
