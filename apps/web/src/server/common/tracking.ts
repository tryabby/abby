import { OpenPanel } from "@openpanel/nextjs";
import { env } from "env/server.mjs";
import type { ServerEvents } from "types/plausible-events";

export type EventProps = Record<string, unknown> | never;
export type EventOptionsTuple<P extends EventProps> = P extends never
  ? [Omit<EventOptions<P>, "props">?]
  : [EventOptions<P>];

export type EventOptions<P extends EventProps> = {
  props: P;
  revenue?: {
    currency: string;
    amount: number;
  };
  u?: string;
  callback?: VoidFunction;
};

class TrackingService {
  private instance: OpenPanel | null = null;

  constructor() {
    if (env.OPENPANEL_CLIENT_SECRET && env.NEXT_PUBLIC_OPENPANEL_CLIENT_ID) {
      this.instance = new OpenPanel({
        clientId: "your-client-id",
        clientSecret: "your-client-secret",
      });
    }
  }
  public trackEvent<const N extends keyof ServerEvents>(
    eventName: N,
    ...eventProperties: ServerEvents[N] extends never
      ? []
      : [EventOptionsTuple<ServerEvents[N]>[0]["props"]]
  ) {
    if (env.NODE_ENV === "development") {
      console.log(`Tracking event: ${eventName}`, eventProperties[0]);
      return;
    }
    this.instance?.track(eventName, eventProperties[0]);
  }
}

export const serverTrackingService = new TrackingService();
