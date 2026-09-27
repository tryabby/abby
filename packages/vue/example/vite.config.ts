import { fileURLToPath } from "node:url";
import { defineConfig } from "vite";

export default defineConfig({
  define: {
    __VUE_OPTIONS_API__: true,
    __VUE_PROD_DEVTOOLS__: false,
    __VUE_PROD_HYDRATION_MISMATCH_DETAILS__: false,
  },
  root: fileURLToPath(new URL(".", import.meta.url)),
  server: { host: "127.0.0.1", port: 4178, strictPort: true },
  plugins: [
    {
      name: "local-abby-fixture",
      configureServer(server) {
        let alternate = false;
        const events: unknown[] = [];
        server.middlewares.use((request, response, next) => {
          const pathname = new URL(request.url ?? "/", "http://127.0.0.1")
            .pathname;
          const reply = (data: unknown) => {
            response.setHeader("Content-Type", "application/json");
            response.end(JSON.stringify(data));
          };
          if (
            pathname === "/api/v2/data/vue-example" &&
            request.method === "GET"
          ) {
            reply({
              tests: [
                { name: "checkout", weights: alternate ? [1, 0] : [0, 1] },
              ],
              flags: [{ name: "banner", value: !alternate }],
              remoteConfig: [
                {
                  name: "title",
                  value: alternate ? "Welcome back" : "Welcome",
                },
              ],
            });
          } else if (
            pathname === "/fixture/toggle" &&
            request.method === "POST"
          ) {
            alternate = !alternate;
            reply({ alternate });
          } else if (
            pathname === "/fixture/events" &&
            request.method === "GET"
          ) {
            reply(events);
          } else if (pathname === "/api/data" && request.method === "POST") {
            let body = "";
            request.on("data", (chunk) => {
              body += chunk;
            });
            request.on("end", () => {
              try {
                events.push(JSON.parse(body));
                reply({ recorded: true });
              } catch {
                response.statusCode = 400;
                reply({ error: "Invalid event JSON" });
              }
            });
          } else next();
        });
      },
    },
  ],
});
