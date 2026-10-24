// @vitest-environment node
import { execFileSync } from "node:child_process";
import { expect, it } from "vitest";

it.each(["module", "commonjs"])(
  "loads the built %s package entry",
  (format) => {
    const load =
      format === "module"
        ? 'import { createAbby } from "@tryabby/vue";'
        : 'const { createAbby } = require("@tryabby/vue");';
    const result = execFileSync(
      process.execPath,
      [
        "--input-type",
        format,
        "-e",
        `${load}
    const sdk = createAbby({projectId:'consumer',currentEnvironment:'test',environments:['test'],remoteConfig:{price:'Number'}});
    console.log(JSON.stringify({value:sdk.getRemoteConfig('price'), variants:typeof sdk.getVariants}));
  `,
      ],
      { cwd: process.cwd(), encoding: "utf8" }
    );
    expect(JSON.parse(result)).toEqual({ value: 0, variants: "function" });
  }
);
