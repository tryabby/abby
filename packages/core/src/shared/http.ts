import { TypeOf } from "zod";
import { ABBY_BASE_URL } from "./constants";
import type { AbbyEventType, AbbyEvent, AbbyDataResponse } from "./index";
import fetch from "node-fetch";
export class HttpService {
  constructor({ fetch2 }: { fetch2?: typeof globalThis.fetch | typeof fetch } = {}) {
    this.#fetchFunction = fetch2 ?? globalThis.fetch;
  }
  #fetchFunction: typeof globalThis.fetch | typeof fetch;

  async getProjectData({
    projectId,
    environment,
    url,
  }: {
    projectId: string;
    environment?: string;
    url?: string;
  }) {
    try {
      const res = await this.#fetchFunction(
        `${url ?? ABBY_BASE_URL}api/v1/data/${projectId}${
          environment ? `?environment=${environment}` : ""
        }`
      );

      if (!res.ok) return null;

      const data = (await res.json()) as AbbyDataResponse;
      return data;
    } catch (err) {
      console.error("[ABBY]: failed to load project data, falling back to defaults");
      return null;
    }
  }

  sendData({
    url,
    type,
    data,
  }: {
    url?: string;
    type: AbbyEventType;
    data: Omit<AbbyEvent, "type">;
  }) {
    if (typeof window === "undefined" || window.location.hostname === "localhost") {
      if (typeof window === "undefined" || window.location.hostname === "localhost") {
        // don't send data in development
        return;
      }
      return this.#fetchFunction(`${url ?? ABBY_BASE_URL}api/data`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ type, ...data }),
        // catch error and forget about them for now
        // TODO: add error debugging
      }).catch(() => {});
    }
  }
}
