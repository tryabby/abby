import { testClient } from "hono/testing";
import { makeEventRoute } from "./v1_event";
import { AbbyEventType } from "@tryabby/core";
import { prisma } from "server/db/client";
import { redis } from "server/db/redis";

vi.mock("server/common/plans", () => ({
  getLimitByPlan: vi.fn(() => {}),
}));

vi.mock("../../env/client.mjs", () => ({}));

vi.mock("server/db/client", () => ({
  prisma: {
    event: {
      create: vi.fn(),
    },
    apiRequest: {
      create: vi.fn(),
    },
  },
}));

vi.mock("server/db/redis", () => ({
  redis: {
    incr: vi.fn(async () => "test"),
  },
}));

afterEach(() => {
  vi.resetAllMocks();
});

it("should work with correct PING events", async () => {
  const app = makeEventRoute();

  const res = await testClient(app).index.$post({
    json: {
      projectId: "test",
      selectedVariant: "test",
      testName: "test",
      type: AbbyEventType.PING,
    },
  });

  expect(prisma.event.create).toHaveBeenCalledTimes(1);
  expect(prisma.apiRequest.create).toHaveBeenCalledTimes(1);
  expect(redis.incr).toHaveBeenCalledTimes(1);
});

it("should work with correct ACT events", async () => {
  const app = makeEventRoute();

  const res = await testClient(app).index.$post({
    json: {
      projectId: "test",
      selectedVariant: "test",
      testName: "test",
      type: AbbyEventType.ACT,
    },
  });

  expect(res.status).toEqual(200);
  expect(prisma.event.create).toHaveBeenCalledTimes(1);
  expect(prisma.apiRequest.create).toHaveBeenCalledTimes(1);
  expect(redis.incr).toHaveBeenCalledTimes(1);
});

it("should ignore unknown events", async () => {
  const app = makeEventRoute();

  const res = await testClient(app).index.$post({
    json: {
      projectId: "test",
      selectedVariant: "test",
      testName: "test",
      type: 3 as any,
    },
  });

  expect(res.status).toBeGreaterThanOrEqual(400);
  expect(prisma.event.create).toHaveBeenCalledTimes(0);
  expect(prisma.apiRequest.create).toHaveBeenCalledTimes(0);
  expect(redis.incr).toHaveBeenCalledTimes(0);
});
