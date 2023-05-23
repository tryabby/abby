import { z } from "zod";

export const ABBY_BASE_URL = "https://tryabby.com/";

export type AbbyEvent = z.infer<typeof abbyEventSchema>;

export enum AbbyEventType {
  PING,
  ACT,
}

export const abbyEventSchema = z.object({
  type: z.nativeEnum(AbbyEventType),
  projectId: z.string(),
  testName: z.string(),
  selectedVariant: z.string(),
});

export type AbbyDataResponse = {
  tests: Array<{
    name: string;
    weights: number[];
  }>;
  flags: Array<{ name: string; isEnabled: boolean }>;
};

export abstract class HttpService {
  static async getProjectData({
    projectId,
    environment,
    url,
  }: {
    projectId: string;
    environment?: string;
    url?: string;
  }) {
    try {
      const res = await fetch(
        `${url ?? ABBY_BASE_URL}api/dashboard/${projectId}/data${
          environment ? `?environment=${environment}` : ""
        }`
      );
      if (!res.ok) return null;
      const data = (await res.json()) as AbbyDataResponse;
      return data;
    } catch (err) {
      console.error(
        "[ABBY]: failed to load project data, falling back to defaults"
      );
      return null;
    }
  }

  static sendData({
    url,
    type,
    data,
  }: {
    url?: string;
    type: AbbyEventType;
    data: Omit<AbbyEvent, "type">;
  }) {
    if (
      typeof window === "undefined" ||
      window.location.hostname === "localhost"
    ) {
      // don't send data in development
      return;
    }
    return fetch(`${url ?? ABBY_BASE_URL}api/data`, {
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

export const ABBY_AB_STORAGE_PREFIX = "__abby__ab__";
export const ABBY_FF_STORAGE_PREFIX = "__abby__ff__";

export function getABStorageKey(projectId: string, testName: string): string {
  return `${ABBY_AB_STORAGE_PREFIX}${projectId}_${testName}`;
}

export function getFFStorageKey(projectId: string, flagName: string): string {
  return `${ABBY_FF_STORAGE_PREFIX}${projectId}_${flagName}`;
}
