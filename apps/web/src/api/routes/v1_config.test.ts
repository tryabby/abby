import { testClient } from "hono/testing";
import { prisma } from "server/db/client";
import { type handleGET, handlePUT } from "server/services/ConfigService";
import { makeConfigRoute } from "./v1_config";

vi.mock("../../env/server.mjs", () => ({
  env: {
    HASHING_SECRET: "test",
  },
}));

const mockConfig = {
  environments: ["test"],
  flags: [],
  remoteConfig: {},
  tests: {},
} satisfies Awaited<ReturnType<typeof handleGET>>;

vi.mock("server/services/ConfigService", () => ({
  handleGET: vi.fn(() => mockConfig),
  handlePUT: vi.fn(() => mockConfig),
}));

vi.mock("server/db/redis", () => ({
  redis: {
    incr: vi.fn(async () => "test"),
  },
}));

vi.mock("server/db/client", () => ({
  prisma: {
    apiKey: {
      findUnique: vi.fn().mockResolvedValue({
        validUntil: new Date(Date.now() + 1000),
        revokedAt: null,
      }),
    },
  },
}));

describe("Retreive Config", () => {
  it("should work with correct with an API provided", async () => {
    const app = makeConfigRoute();

    const res = await testClient(app)[":projectId"].$get(
      {
        param: {
          projectId: "test",
        },
      },
      {
        headers: {
          Authorization: "Bearer test",
        },
      }
    );
    const data = await res.json();

    expect(res.status).toEqual(200);
    expect(data).toEqual(mockConfig);
  });

  it("should return an error if the API key is not provided", async () => {
    const app = makeConfigRoute();

    const res = await testClient(app)[":projectId"].$get({
      param: {
        projectId: "test",
      },
    });

    expect(res.status).toEqual(401);
  });

  it("should return an error if the API key is not found", async () => {
    const app = makeConfigRoute();
    vi.mocked(prisma.apiKey.findUnique).mockResolvedValueOnce(null);

    const res = await testClient(app)[":projectId"].$get(
      {
        param: {
          projectId: "test",
        },
      },
      {
        headers: {
          Authorization: "Bearer test",
        },
      }
    );

    expect(res.status).toEqual(401);
  });

  it("should return an error if the API key is outdated", async () => {
    const app = makeConfigRoute();

    vi.mocked(prisma.apiKey.findUnique).mockResolvedValueOnce({
      validUntil: new Date(Date.now() - 1000),
      revokedAt: null,
    } as any);

    const res = await testClient(app)[":projectId"].$get(
      {
        param: {
          projectId: "test",
        },
      },
      {
        headers: {
          Authorization: "Bearer test",
        },
      }
    );

    expect(res.status).toEqual(401);
  });

  it("should return an error if the API key is revoked", async () => {
    const app = makeConfigRoute();

    vi.mocked(prisma.apiKey.findUnique).mockResolvedValueOnce({
      validUntil: new Date(Date.now() - 1000),
      revokedAt: new Date(),
    } as any);

    const res = await testClient(app)[":projectId"].$get(
      {
        param: {
          projectId: "test",
        },
      },
      {
        headers: {
          Authorization: "Bearer test",
        },
      }
    );

    expect(res.status).toEqual(401);
  });
});

describe("Update Config", () => {
  it("should work with correct with an API provided", async () => {
    const app = makeConfigRoute();

    const res = await testClient(app)[":projectId"].$put(
      {
        param: {
          projectId: "test",
        },
        json: {
          environments: ["test"],
          flags: [],
          remoteConfig: {},
          tests: {},
          projectId: "test",
          apiUrl: "test",
        },
      },
      {
        headers: {
          Authorization: "Bearer test",
        },
      }
    );

    expect(res.status).toEqual(200);
    expect(vi.mocked(handlePUT)).toHaveBeenCalledTimes(1);
  });

  it("should not work with invalid api keys", async () => {
    const app = makeConfigRoute();

    const makeRequest = () =>
      testClient(app)[":projectId"].$put(
        {
          param: {
            projectId: "test",
          },
          json: {
            environments: ["test"],
            flags: [],
            remoteConfig: {},
            tests: {},
            projectId: "test",
            apiUrl: "test",
          },
        },
        {
          headers: {
            Authorization: "Bearer test",
          },
        }
      );

    vi.mocked(prisma.apiKey.findUnique).mockResolvedValueOnce(null);

    let res = await makeRequest();

    expect(res.status).toBeGreaterThanOrEqual(400);

    vi.mocked(prisma.apiKey.findUnique).mockResolvedValueOnce({
      validUntil: new Date(Date.now() - 1000),
      revokedAt: null,
    } as any);

    res = await makeRequest();

    expect(res.status).toBeGreaterThanOrEqual(400);

    vi.mocked(prisma.apiKey.findUnique).mockResolvedValueOnce({
      validUntil: new Date(),
      revokedAt: new Date(),
    } as any);

    res = await makeRequest();

    expect(res.status).toBeGreaterThanOrEqual(400);
  });
});
