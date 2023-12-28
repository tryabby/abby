import { PlanName } from "server/common/plans";
import { BaseJob, LibraryJob } from "./types";
import { ApiVersion } from "@prisma/client";
import { trackPlanOverage } from "lib/logsnag";
import { RequestCache } from "server/services/RequestCache";
import { RequestService } from "server/services/RequestService";

type AfterRequest = {
  functionDuration: number;
  projectId: string;
  plan: PlanName | undefined;
  is80PercentOfLimit: boolean;
  apiVersion: ApiVersion;
};

export class AfterDataRequest extends BaseJob<AfterRequest> {
  readonly type = "after-data-request";

  async emit(data: AfterRequest): Promise<void> {
    return this.work({ data });
  }

  async work({
    data: { apiVersion, functionDuration, is80PercentOfLimit, plan, projectId },
  }: LibraryJob<AfterRequest>): Promise<void> {
    setTimeout(async () => {
      if (is80PercentOfLimit) {
        await trackPlanOverage(projectId, plan, is80PercentOfLimit);
      }

      await RequestCache.increment(projectId);

      RequestService.storeRequest({
        projectId,
        type: "GET_CONFIG",
        durationInMs: functionDuration,
        apiVersion,
      }).catch((e) => {
        console.error("Unable to store request", e);
      });
    }, 1);

    return Promise.resolve();
  }
}
