// packages/vue/demo/ssr-demo.cjs — plain Node CJS SSR demo for @tryabby/vue (issue #68).
// No TypeScript, no browser, no ESM import maps. Run from abby repo root:
//   node packages/vue/demo/ssr-demo.cjs
// Requires the BUILT packages/vue/dist/index.js (CJS) + vue CJS + @vue/server-renderer.
const path = require("path");
const fs = require("fs");

// 1) Vue CJS: require('vue') resolves to vue/dist/vue.cjs.js via its package.json.
//    Fallback to the explicit path inside packages/vue/node_modules.
let vue;
try {
  vue = require("vue");
} catch (e) {
  vue = require(
    path.join(__dirname, "..", "node_modules", "vue", "dist", "vue.cjs.js")
  );
}
const { createSSRApp, h } = vue;

// 2) Server renderer (CJS)
let serverRenderer;
try {
  serverRenderer = require("@vue/server-renderer");
} catch (e) {
  serverRenderer = require(
    path.join(
      __dirname,
      "..",
      "node_modules",
      "@vue",
      "server-renderer",
      "dist",
      "server-renderer.cjs.js"
    )
  );
}
const { renderToString } = serverRenderer;

// 3) Built @tryabby/vue CJS bundle
const { createAbby } = require("../dist/index.js");

// 4) Same demo config as the browser demo (demo/index.html)
const { AbbyProvider, useAbby, useFeatureFlag, useRemoteConfig } = createAbby({
  environments: [""],
  currentEnvironment: "",
  projectId: "demo",
  tests: { footer: { variants: ["OldFooter", "NewFooter"] } },
  flags: ["newHeader"],
  remoteConfig: { welcomeText: "String" },
});

// Deterministic: weights [0,1] always select NewFooter on the client.
// NOTE: useAbby renders "" on the server by design (SSR mismatch guard;
// onMounted never runs during SSR). Flags + remoteConfig DO render on SSR.
const initialData = {
  tests: [{ name: "footer", weights: [0, 1] }],
  flags: [{ name: "newHeader", value: true }],
  remoteConfig: [{ name: "welcomeText", value: "Hello from Abby Vue!" }],
};

// Child component with h() only (NO templates)
const Demo = {
  setup() {
    const { variant, onAct } = useAbby("footer");
    const header = useFeatureFlag("newHeader");
    const welcome = useRemoteConfig("welcomeText");
    void onAct;
    return () =>
      h("div", [
        h("div", { class: "card" }, [
          'useAbby("footer") -> variant: ',
          h("b", { id: "variant" }, String(variant.value)),
        ]),
        h("div", { class: "card" }, [
          'useFeatureFlag("newHeader") -> ',
          h("b", { id: "flag" }, String(header.value)),
        ]),
        h("div", { class: "card" }, [
          'useRemoteConfig("welcomeText") -> ',
          h("b", { id: "welcome" }, String(welcome.value)),
        ]),
      ]);
  },
};

async function main() {
  const app = createSSRApp({
    render: () =>
      h(AbbyProvider, { initialData }, { default: () => h(Demo) }),
  });
  const html = await renderToString(app);
  console.log(html);
  const doc =
    "<!DOCTYPE html>\n" +
    '<html lang="en">\n<head>\n<meta charset="utf-8" />\n' +
    "<title>@tryabby/vue SSR demo (issue #68)</title>\n" +
    "<style>body{font-family:system-ui,sans-serif;max-width:640px;margin:40px auto;padding:0 16px} .card{border:1px solid #ddd;border-radius:8px;padding:16px;margin:12px 0}</style>\n" +
    "</head>\n<body>\n<h1>@tryabby/vue SSR demo</h1>\n" +
    '<div id="app">' +
    html +
    "</div>\n</body>\n</html>\n";
  fs.writeFileSync(path.join(__dirname, "ssr-output.html"), doc, "utf8");
  console.log("[ssr-demo] wrote " + path.join(__dirname, "ssr-output.html"));
}

main().catch((err) => {
  console.error("[ssr-demo] FAILED:", err && err.stack ? err.stack : err);
  process.exit(1);
});
