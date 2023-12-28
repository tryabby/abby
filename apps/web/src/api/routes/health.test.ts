import { testClient } from "hono/testing";
import { makeHealthRoute } from "./health";

vi.mock("server/db/client", () => ({
  prisma: {
    verificationToken: {
      count: vi.fn(async () => 1),
    },
  },
}));

vi.mock("server/db/redis", () => ({
  redis: {
    get: vi.fn(async () => "test"),
  },
}));

it("should work", async () => {
  const app = makeHealthRoute();

  const res = await testClient(app).index.$get();

  expect(res.status).toEqual(200);
  expect(await res.json()).toEqual({ status: "ok" });
});
