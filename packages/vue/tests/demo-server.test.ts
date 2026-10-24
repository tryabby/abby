// @vitest-environment node
import { spawn } from "node:child_process";
import { once } from "node:events";
import { copyFile, mkdir, mkdtemp, rm, writeFile } from "node:fs/promises";
import { get } from "node:http";
import { type AddressInfo, createServer } from "node:net";
import { tmpdir } from "node:os";
import path from "node:path";
import { expect, it } from "vitest";

it("returns 400 for malformed URL encoding and keeps serving requests", async () => {
  const temporaryRoot = path.resolve(tmpdir());
  const directory = await mkdtemp(path.join(temporaryRoot, "abby-vue-demo-"));
  // Only this test's direct temporary child may be removed during cleanup.
  if (path.dirname(directory) !== temporaryRoot)
    throw new Error("Unexpected temporary path");
  const listener = createServer();
  listener.listen(0, "127.0.0.1");
  await once(listener, "listening");
  const port = (listener.address() as AddressInfo).port;
  await new Promise<void>((resolve) => listener.close(() => resolve()));
  await mkdir(path.join(directory, "build"));
  await writeFile(
    path.join(directory, "build/index.html"),
    "Demo is available"
  );
  await copyFile(
    new URL("../demo/serve.mjs", import.meta.url),
    path.join(directory, "serve.mjs")
  );
  const child = spawn(process.execPath, [path.join(directory, "serve.mjs")], {
    env: { ...process.env, PORT: String(port) },
    stdio: ["ignore", "pipe", "pipe"],
  });
  const exited = once(child, "exit");
  let stderr = "";
  child.stderr.on("data", (chunk) => {
    stderr += chunk;
  });
  const request = (pathname: string) =>
    new Promise<{ status: number | undefined; body: string }>(
      (resolve, reject) => {
        const request = get(
          { hostname: "127.0.0.1", port, path: pathname },
          (response) => {
            let body = "";
            response.setEncoding("utf8");
            response.on("data", (chunk) => {
              body += chunk;
            });
            response.on("end", () =>
              resolve({ status: response.statusCode, body })
            );
          }
        );
        request.on("error", reject);
        request.setTimeout(2000, () =>
          request.destroy(new Error("Request timed out"))
        );
      }
    );
  try {
    await Promise.race([
      once(child.stdout, "data"),
      exited.then(() => {
        throw new Error(`Demo server exited before listening: ${stderr}`);
      }),
    ]);
    expect((await request("/%ZZ")).status).toBe(400);
    expect(await request("/")).toEqual({
      status: 200,
      body: "Demo is available",
    });
    expect(child.exitCode).toBeNull();
    expect(stderr).toBe("");
  } finally {
    if (child.exitCode === null) child.kill();
    await exited;
    await rm(directory, { recursive: true, force: true });
    if (stderr) console.error(stderr);
  }
});
