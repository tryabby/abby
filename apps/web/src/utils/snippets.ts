import * as fs from "node:fs/promises";
import path from "node:path";
import type { FeatureFlag, Option, Test } from "@prisma/client";
import type { AbbyConfig, RemoteConfigValueString } from "@tryabby/core";
import { transformDBFlagTypeToclient } from "lib/flags";
import prettier from "prettier";
import { getHighlighter } from "shiki";

// Shiki loads languages and themes using "fs" instead of "import", so Next.js
// doesn't bundle them into production build. To work around, we manually copy
// them over to our source code (lib/shiki/*) and update the "paths".
//
// Note that they are only referenced on server side
// See: https://github.com/shikijs/shiki/issues/138
const getShikiPath = (): string => {
  return path.join(process.cwd(), "src/lib/shiki");
};

const touched = { current: false };

// "Touch" the shiki assets so that Vercel will include them in the production
// bundle. This is required because shiki itself dynamically access these files,
// so Vercel doesn't know about them by default
const touchShikiPath = (): void => {
  if (touched.current) return; // only need to do once
  fs.readdir(getShikiPath()); // fire and forget
  touched.current = true;
};

const formatCode = (code: string) => {
  return prettier.format(
    code.replace('"process.env.NODE_ENV"', "process.env.NODE_ENV"),
    {
      parser: "typescript",
    }
  );
};

export type CodeSnippetData = {
  code: string;
  html: string;
};

export type Integrations = "react" | "nextjs" | "svelte" | "angular";

export async function generateCodeSnippets({
  projectId,
  tests,
  flags,
}: {
  projectId: string;
  tests: Array<
    Pick<Test, "name"> & {
      options: Pick<Option, "identifier">[];
    }
  >;
  flags: Array<Pick<FeatureFlag, "name" | "type">>;
}): Promise<Record<Integrations, CodeSnippetData>> {
  touchShikiPath();

  const baseConfig = JSON.stringify(
    {
      projectId,
      currentEnvironment: "process.env.NODE_ENV",
      flags: flags
        .filter((flag) => flag.type === "BOOLEAN")
        .map((flag) => flag.name),
      remoteConfig: flags.reduce(
        (acc, flag) => {
          if (flag.type !== "BOOLEAN") {
            acc[flag.name] = transformDBFlagTypeToclient(
              flag.type
            ) as RemoteConfigValueString;
          }
          return acc;
        },
        {} as Record<string, RemoteConfigValueString>
      ),
      tests: tests.reduce(
        (acc, test) => {
          acc[test.name] = {
            variants: test.options.map((option) => option.identifier),
          };
          return acc;
        },
        {} as NonNullable<AbbyConfig["tests"]>
      ),
    } as AbbyConfig,
    null,
    2
  );

  const reactCode = formatCode(
    `import { createAbby } from "@tryabby/react"; 
    
    export const { useAbby, AbbyProvider, useFeatureFlag } = createAbby(${baseConfig})`
  );

  const nextJsCode = formatCode(
    `import { createAbby } from "@tryabby/next"; 
    
    export const { useAbby, AbbyProvider, useFeatureFlag, withAbby } = createAbby(${baseConfig})`
  );

  const svelteCode = formatCode(
    `import { createAbby } from "@tryabby/svelte"; 
    
    export const { useAbby, AbbyProvider, useFeatureFlag, withAbby } = createAbby(${baseConfig})`
  );

  const angularCode = formatCode(
    `import { AbbyModule } from "@tryabby/angular"; 

    @NgModule({
      declarations: [
        // your declarations
      ],
      imports: [
        AbbyModule.forRoot(${baseConfig})
      ],
      bootstrap: [AppComponent]
    })
    export class AppModule {}`
  );

  const highlighter = await getHighlighter({
    // it is in-fact a proper theme, but the types are wrong
    theme: "poimandres",
    paths: {
      languages: `${getShikiPath()}/languages/`,
      themes: `${getShikiPath()}/themes/`,
    },
  });

  return {
    react: {
      code: reactCode,
      html: highlighter.codeToHtml(reactCode, {
        lang: "tsx",
      }),
    },
    nextjs: {
      code: nextJsCode,
      html: highlighter.codeToHtml(nextJsCode, {
        lang: "tsx",
      }),
    },
    svelte: {
      code: svelteCode,
      html: highlighter.codeToHtml(svelteCode, {
        lang: "svelte",
      }),
    },
    angular: {
      code: angularCode,
      html: highlighter.codeToHtml(angularCode, {
        lang: "tsx",
      }),
    },
  };
}
