import { env } from "env/server.mjs";
import { LogSnag } from "logsnag";
import type { PlanName } from "server/common/plans";

const logsnag = new LogSnag({
  token: env.LOGSNAG_API_KEY,
  project: "abby",
});

export function trackSignup() {
  if (process.env.NODE_ENV !== "production") return;
  return logsnag.publish({
    channel: "user-register",
    event: "user-register",
    icon: "👋",
    notify: true,
  });
}

export function trackPlanOverage(
  projectId: string,
  plan: PlanName | undefined,
  is80Percent?: boolean
) {
  if (process.env.NODE_ENV !== "production") return;
  return logsnag.publish({
    channel: "plan-overrage",
    event: is80Percent ? "Limit reached" : "80% reached",
    icon: "⚠️",
    tags: {
      plan: plan ?? "HOBBY",
      projectId,
    },
    notify: true,
  });
}
