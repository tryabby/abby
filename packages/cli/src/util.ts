import { abbyConfigSchema } from "@tryabby/core";
import { loadConfig } from "unconfig";
import { config as loadEnv } from "dotenv";
import path from "path";
import portFinder from "portfinder";
import polka from "polka";
import { ABBY_BASE_URL } from "./consts";
import cors from "cors";
import fs from "fs/promises";
import { writeFile, loadFile, parseModule } from "magicast";

export async function loadLocalConfig(configPath?: string) {
  loadEnv();

  let cwd = process.cwd();
  let fileName = "abby.config";
  let extensions = ["ts", "js", "mjs", "cjs"];

  // if configPath is provided, use it to load the config
  if (configPath) {
    const config = path.resolve(configPath);

    cwd = path.dirname(config);
    fileName = path.basename(config, path.extname(config));
    extensions = [path.extname(config).slice(1)];
  }

  const { config, sources } = await loadConfig({
    sources: [
      {
        files: fileName,
        extensions,
      },
    ],
    cwd,
  });

  if (!config || !sources[0]) throw new Error("Could not load config file");

  const result = await abbyConfigSchema.safeParseAsync(config);
  if (!result.success) {
    console.error(result.error);
    throw new Error("Invalid config file");
  }
  const originalConfig = await fs.readFile(sources[0], "utf-8");
  const mod = await loadFile(sources[0]);
  if (mod.exports.default.$type !== "function-call") throw new Error("Invalid config file");

  return {
    config: result.data,
    configFilePath: sources[0],
    mutableConfig: mod.exports.default.$args[1],
    saveMutableConfig: () => writeFile(mod, sources[0]),
    restoreConfig: () => {
      const mod = parseModule(originalConfig);
      return writeFile(mod, sources[0]);
    },
  };
}

export function multiLineLog(...args: any[]) {
  console.log(args.join("\n"));
}

export async function startServerAndGetToken(host?: string) {
  const freePort = await portFinder.getPortPromise();

  const url = new URL(host ?? ABBY_BASE_URL);
  url.pathname = "/profile/generate-token";
  url.searchParams.set("callbackUrl", `http://localhost:${freePort}`);
  console.log(`Please open the following URL in your Browser: ${url}`);

  return new Promise<string>(async (resolve) => {
    const server = polka()
      .use(
        cors({
          origin: "*",
          methods: ["GET"],
        })
      )
      .get("/", (req, res) => {
        const token = req.query.token;
        if (typeof token !== "string") {
          res.statusCode = 400;
          res.end("Invalid token");
          return;
        }
        res.statusCode = 200;
        res.end();

        server.server?.close();
        resolve(token);
      })
      .listen(freePort);

    process.on("SIGTERM", () => {
      server.server?.closeAllConnections();
      server.server?.close();
    });
  });
}
