import { env } from "env/client.mjs";
import { PlausibleEvents } from "types/plausible-events";

export abstract class PlausibleService {
  private static readonly PLAUSIBLE_API_URL = "https://plausible.io/api";
  private static readonly SITE_DOMAIN = env.NEXT_PUBLIC_PLAUSIBLE_DOMAIN;

  // API calls to the Plausible API require a UserAgent to be set
  // for tracking. For privacy reasons, we will use a static random
  // UserAgent, indicating that an event was triggered by the backend
  private static readonly BACKEND_USER_AGENT =
    "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/96.0.4664.110 Safari/537.36 RuxitSynthetic/1.0 v5219369128283793614 t7034606369950548413 athe94ac249 altpriv cvcv=2 smf=0";

  static async trackPlausibleGoal<EventName extends keyof PlausibleEvents>(
    eventName: EventName,
    props?: PlausibleEvents[EventName],
    url?: string
  ) {
    if (process.env.NODE_ENV !== "production" || !this.SITE_DOMAIN) {
      return;
    }

    const res = await fetch(`${this.PLAUSIBLE_API_URL}/event`, {
      method: "POST",
      headers: {
        "User-Agent": this.BACKEND_USER_AGENT,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        name: eventName,
        domain: this.SITE_DOMAIN,
        url: url ?? `${this.SITE_DOMAIN}/api`,
        props,
      }),
    });

    if (!res.ok) {
      console.error(
        `Error while sending tracking data to Plausible: ${res.status} ${res.statusText}`
      );
    }
  }
}
