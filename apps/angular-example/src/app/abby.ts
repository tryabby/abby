import { Injectable } from "@angular/core";
import { AbbyService } from "abby";
import { environment } from "../environments/environment";

export const abby = {
  projectId: environment.ABBY_PROJECT_ID,
  currentEnvironment: "test",
  environments: ["test", "prod"] as Array<string>,
  tests: {
    AngularTest: {
      variants: ["A", "B", "C", "D"],
    },
    NotExistingTest: {
      variants: ["A", "B"],
    },
  },
  flags: { AngularFlag: "Boolean", AngularFlag2: "Boolean", NotExistingFlag: "Boolean" },
  apiUrl: "http://localhost:3000/",
  debug: true,
} as const;

@Injectable({
  providedIn: "root",
  useExisting: AbbyService,
})
export class Abby extends AbbyService<
  keyof (typeof abby)["flags"],
  keyof (typeof abby)["tests"],
  (typeof abby)["tests"],
  (typeof abby)["flags"]
> {}
