import {
  type AbbyDataResponse,
  hashStringToInt32,
  parseAbbyData,
  serializeAbbyData,
} from "../src";

describe("Abby Config (de)serialization", () => {
  it("should serialize and deserialize Abby Config with empty tests", () => {
    const mock: AbbyDataResponse = {
      tests: [],
      flags: [
        {
          name: "FeatureFlagA",
          value: true,
        },
        {
          name: "FeatureFlagB",
          value: false,
        },
      ],
      remoteConfig: [
        {
          name: "ConfigA",
          value: "defaultValue",
        },
        {
          name: "ConfigB",
          value: 12345,
        },
        {
          name: "ConfigC",
          value: {
            key1: "value1",
            key2: "value2",
          },
        },
      ],
    };

    const serialized = serializeAbbyData(mock);

    const deserialized = parseAbbyData(serialized);

    expect(deserialized).toEqual(mock);
  });

  it("should serialize and deserialize Abby Config with empty flags", () => {
    const mock: AbbyDataResponse = {
      tests: [
        {
          name: "A/B Test - Button Color",
          weights: [0.5, 0.5],
        },
        {
          name: "Landing Page Layout",
          weights: [0.4, 0.6],
        },
      ],
      flags: [],
      remoteConfig: [
        {
          name: "ConfigA",
          value: "defaultValue",
        },
        {
          name: "ConfigB",
          value: 12345,
        },
        {
          name: "ConfigC",
          value: {
            key1: "value1",
            key2: "value2",
          },
        },
      ],
    };

    const serialized = serializeAbbyData(mock);

    const deserialized = parseAbbyData(serialized);

    expect(deserialized).toEqual(mock);
  });

  it("should serialize and deserialize Abby Config with empty remote config", () => {
    const mock: AbbyDataResponse = {
      tests: [
        {
          name: "A/B Test - Button Color",
          weights: [0.5, 0.5],
        },
        {
          name: "Landing Page Layout",
          weights: [0.4, 0.6],
        },
      ],
      flags: [
        {
          name: "FeatureFlagA",
          value: true,
        },
        {
          name: "FeatureFlagB",
          value: false,
        },
      ],
      remoteConfig: [],
    };

    const serialized = serializeAbbyData(mock);

    const deserialized = parseAbbyData(serialized);

    expect(deserialized).toEqual(mock);
  });

  it("should minify the config", () => {
    const mock: AbbyDataResponse = {
      tests: [
        {
          name: "A/B Test - Button Color",
          weights: [0.5, 0.5],
        },
        {
          name: "Landing Page Layout",
          weights: [0.4, 0.6],
        },
      ],
      flags: [
        {
          name: "FeatureFlagA",
          value: true,
        },
        {
          name: "FeatureFlagB",
          value: false,
        },
      ],
      remoteConfig: [
        {
          name: "ConfigA",
          value: "defaultValue",
        },
        {
          name: "ConfigB",
          value: 12345,
        },
        {
          name: "ConfigC",
          value: {
            key1: "value1",
            key2: "value2",
          },
        },
      ],
    };

    const serialized = serializeAbbyData(mock);

    const deserialized = parseAbbyData(serialized);

    expect(deserialized).toEqual(mock);
    expect(JSON.stringify(mock).length).toBeGreaterThan(
      JSON.stringify(serialized).length
    );
  });
});

describe("Hashing", () => {
  it("should hash flag names correctly", () => {
    const flagNames = ["useFlagA", "useFlagB"];
    const [flagName, flagName2] = flagNames;

    const hashed = hashStringToInt32(flagName);
    expect(hashed).toEqual(hashStringToInt32(flagName));

    const hashed2 = hashStringToInt32(flagName2);
    expect(hashed2).toEqual(hashStringToInt32(flagName2));
    expect(hashed).not.toEqual(hashed2);
  });
});
