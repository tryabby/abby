import { testClient } from "hono/testing";
import { makeLegacyProjectDataRoute } from "./legacy_project_data";
import { afterDataRequestQueue } from "@tryabby/queue";
import { FeatureFlag, FeatureFlagValue, Option, Test } from "@tryabby/db";
import { add } from "lodash-es";

vi.mock("../../env/server.mjs", () => ({
  env: {},
}));

vi.mock("@tryabby/queue", () => ({
  afterDataRequestQueue: {
    add: vi.fn().mockResolvedValue(null),
  },
}));

vi.mock("server/db/client", () => ({
  prisma: {
    featureFlagValue: {
      findMany: vi.fn().mockResolvedValue([
        {
          environmentId: "",
          flag: {
            name: "First Flag",
            type: "BOOLEAN",
          },
          flagId: "",
          id: "",
          value: "true",
        },
      ] satisfies Array<FeatureFlagValue & { flag: Pick<FeatureFlag, "name" | "type"> }>),
    },
    test: {
      findMany: vi.fn().mockResolvedValue([
        {
          id: "",
          name: "First Test",
          createdAt: new Date(),
          projectId: "",
          updatedAt: new Date(),
          options: [
            {
              chance: { toNumber: () => 0.25 } as any,
            },
            {
              chance: { toNumber: () => 0.25 } as any,
            },
            {
              chance: { toNumber: () => 0.25 } as any,
            },
            {
              chance: { toNumber: () => 0.25 } as any,
            },
          ],
        },
      ] satisfies Array<
        Test & {
          options: Array<Pick<Option, "chance">>;
        }
      >),
    },
  },
}));

vi.mock("server/db/redis", () => ({
  redis: {
    get: vi.fn(async () => {}),
    incr: vi.fn(async () => {}),
  },
}));

afterEach(() => {
  vi.clearAllMocks();
});

describe("Get Config", () => {
  it("should return the correct config", async () => {
    const app = makeLegacyProjectDataRoute();

    const res = await testClient(app)[":projectId"].data.$get({
      param: {
        projectId: "test",
      },
      query: {
        environment: "test",
      },
    });
    expect(res.status).toBe(200);
    const data = await res.json();

    // typeguard to make test fail if data is not AbbyDataResponse
    if ("error" in data) {
      throw new Error("Expected data to not have an error key");
    }
    expect((data as any).error).toBeUndefined();

    expect(data.tests).toHaveLength(1);
    expect(data.tests?.[0]?.name).toBe("First Test");
    expect(data.tests?.[0]?.weights).toEqual([0.25, 0.25, 0.25, 0.25]);

    expect(data.flags).toHaveLength(1);
    expect(data.flags?.[0]?.name).toBe("First Flag");
    expect(data.flags?.[0]?.isEnabled).toBe(true);

    expect(vi.mocked(afterDataRequestQueue.add)).toHaveBeenCalledTimes(1);
    expect(vi.mocked(afterDataRequestQueue.add)).toHaveBeenCalledWith(
      "after-data-request",
      expect.objectContaining({})
    );
  });
});
