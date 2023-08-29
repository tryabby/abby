import { AbbyConfigFile } from "@tryabby/core";
import fs from "fs/promises";
import * as prettier from "prettier";

export async function initAbbyConfig({ path }: { path: string }) {
  const config: AbbyConfigFile = {
    projectId: "<YOUR_PROJECT_ID>",
    currentEnvironment: "<YOUR_ENVIRONMENT>",
    environments: [],
  };

  const fileContent = `
  import { defineConfig } from '@tryabby/core';


    export default defineConfig(${JSON.stringify(config, null, 2)});
  `;

  await fs.writeFile(path, await prettier.format(fileContent, { parser: "typescript" }));
}
