// packages/vue/@tryabby/vue/tests/useAbby.test.ts
import { useAbby } from "../src/useAbby";

describe("useAbby", () => {
  it("should return the correct variant and onAct method", () => {
    const { variant, onAct } = useAbby("experimentId");

    expect(variant.value).toBeNull();
    // Add more test assertions as needed
  });
});
