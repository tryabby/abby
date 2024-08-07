import fs from "node:fs/promises";
import type { AbbyConfigFile, DynamicConfigKeys } from "@tryabby/core";
import * as prettier from "prettier";

export async function initAbbyConfig({ path }: { path: string }) {
  const dynamicConfig: Pick<AbbyConfigFile, DynamicConfigKeys> = {
    projectId: "<YOUR_PROJECT_ID>",
    currentEnvironment: "<YOUR_ENVIRONMENT>",
  };

  const staticConfig: Omit<AbbyConfigFile, DynamicConfigKeys> = {
    environments: [],
  };

  const fileContent = `
  import { defineConfig } from '@tryabby/core';


    export default defineConfig(${JSON.stringify(dynamicConfig, null, 2)}, ${JSON.stringify(
      staticConfig,
      null,
      2
    )});
  `;

  await fs.writeFile(
    path,
    await prettier.format(fileContent, { parser: "typescript" })
  );
}
