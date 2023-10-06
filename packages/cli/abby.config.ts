import { defineConfig } from "@tryabby/core";

export default defineConfig({
  projectId: "clnecdraj0004a1iwmxifwmds",
  environments: ["test"],
  tests: {},
  flags: ["my-new-flag"],
  remoteConfig: {
    "my-new-remote-config": "JSON",
  },
});
