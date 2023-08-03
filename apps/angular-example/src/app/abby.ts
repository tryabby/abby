import { Injectable } from "@angular/core";
import { AbbyService, InferFlagNames, InferFlags, InferTestNames, InferTests } from "abby";
import abby from "../../abby.config";

@Injectable({
  providedIn: "root",
  useExisting: AbbyService,
})
export class Abby extends AbbyService<
  InferFlagNames<typeof abby>,
  InferTestNames<typeof abby>,
  InferTests<typeof abby>,
  InferFlags<typeof abby>
> {}
