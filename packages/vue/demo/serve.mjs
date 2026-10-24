import { readFile } from "node:fs/promises";
import { createServer } from "node:http";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(fileURLToPath(new URL("./build/", import.meta.url)));
const events = [];
const port = Number(process.env.PORT ?? 8766);
const server = createServer(async (request, response) => {
  const url = new URL(request.url, `http://127.0.0.1:${port}`);
  if (request.method === "POST" && url.pathname === "/api/data") {
    let body = "";
    for await (const chunk of request) {
      body += chunk;
      if (body.length > 16384) {
        response.writeHead(413).end();
        return;
      }
    }
    try {
      const event = JSON.parse(body);
      if (event.projectId !== "vue-local-demo" || ![0, 1].includes(event.type))
        throw new Error("Invalid event");
      events.push(event);
      response
        .writeHead(200, { "Content-Type": "application/json" })
        .end('{"ok":true}');
    } catch {
      response.writeHead(400).end();
    }
    return;
  }
  if (url.pathname === "/events") {
    response
      .writeHead(200, {
        "Content-Type": "application/json",
        "Cache-Control": "no-store",
      })
      .end(JSON.stringify(events));
    return;
  }
  let pathname;
  try {
    pathname = decodeURIComponent(
      url.pathname === "/" ? "/index.html" : url.pathname
    );
  } catch {
    response.writeHead(400).end();
    return;
  }
  const filename = path.resolve(root, `.${pathname}`);
  if (
    !filename.startsWith(`${root}${path.sep}`) &&
    filename !== path.join(root, "index.html")
  ) {
    response.writeHead(403).end();
    return;
  }
  try {
    const content = await readFile(filename);
    const types = {
      ".html": "text/html",
      ".js": "text/javascript",
      ".css": "text/css",
    };
    response
      .writeHead(200, {
        "Content-Type":
          types[path.extname(filename)] ?? "application/octet-stream",
      })
      .end(content);
  } catch {
    response.writeHead(404).end();
  }
});
server.listen(port, "127.0.0.1", () =>
  console.log(`Abby Vue local fixture: http://127.0.0.1:${port}`)
);
