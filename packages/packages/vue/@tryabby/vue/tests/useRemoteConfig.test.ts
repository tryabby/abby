// packages/vue/@tryabby/vue/tests/useRemoteConfig.test.ts
import { useRemoteConfig } from "../src/useRemoteConfig";

describe("useRemoteConfig", () => {
  it("should return the correct remote config value", () => {
    const { configValue } = useRemoteConfig("configKey");

    expect(configValue.value).toBeNull();
    // Add more test assertions as needed
  });
});
