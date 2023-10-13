import { defineConfig } from "@tryabby/angular";
import { environment } from "src/environments/environment";

export default defineConfig(
  {
    projectId: environment.ABBY_PROJECT_ID,
    currentEnvironment: "test",
    apiUrl: "http://localhost:3000/",
    debug: true,
  },
  {
    environments: ["test", "prod"],
    tests: {
      AngularTest: {
        variants: ["A", "B", "C", "D"],
      },
      NotExistingTest: {
        variants: ["A", "B"],
      },
    },
    flags: ["AngularFlag", "AngularFlag2", "NotExistingFlag"],
    remoteConfig: {
      angularRemoteConfig: "String",
    },
  }
);
