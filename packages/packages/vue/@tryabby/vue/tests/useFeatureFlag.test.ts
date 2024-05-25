// packages/vue/@tryabby/vue/tests/useFeatureFlag.test.ts
import { useFeatureFlag } from "../src/useFeatureFlag";

describe("useFeatureFlag", () => {
  it("should return the correct flag value", () => {
    const { flagValue } = useFeatureFlag("featureFlagName");

    expect(flagValue.value).toBeNull();
    // Add more test assertions as needed
  });
});
