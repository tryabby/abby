import { handle } from "@hono/node-server/vercel";
import { app } from "api";

export default handle(app);

export const config = {
  api: {
    bodyParser: false,
  },
};
