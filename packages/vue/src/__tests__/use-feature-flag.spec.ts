import { describe, it, expect, vi, beforeEach } from "vitest";
import { useFeatureFlag } from "../use-feature-flag";
import * as core from "@tryabby/core";

vi.mock("@tryabby/core");

describe("useFeatureFlag", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should initialize with enabled state", () => {
    const mockConfig = { featureFlags: { flag1: {} } };
    
    vi.mocked(core.getFeatureFlag).mockReturnValue(true);

    const result = useFeatureFlag(mockConfig as any, "flag1");

    expect(result.isEnabled.value).toBe(true);
  });

  it("should initialize with disabled state", () => {
    const mockConfig = { featureFlags: { flag1: {} } };
    
    vi.mocked(core.getFeatureFlag).mockReturnValue(false);

    const result = useFeatureFlag(mockConfig as any, "flag1");

    expect(result.isEnabled.value).toBe(false);
  });

  it("should throw error when config is missing", () => {
    expect(() => useFeatureFlag(null as any, "flag1")).toThrow(
      "Abby config is required"
    );
  });

  it("should throw error when flag name is missing", () => {
    const mockConfig = { featureFlags: {} };
    
    expect(() => useFeatureFlag(mockConfig as any, "" as any)).toThrow(
      "Feature flag name is required"
    );
  });

  it("should handle core errors gracefully", () => {
    const mockConfig = { featureFlags: { flag1: {} } };
    
    vi.mocked(core.getFeatureFlag).mockImplementation(() => {
      throw new Error("Flag not found");
    });

    expect(() => useFeatureFlag(mockConfig as any, "flag1")).toThrow(
      'Failed to initialize useFeatureFlag for flag "flag1"'
    );
  });

  it("should return readonly ref", () => {
    const mockConfig = { featureFlags: { flag1: {} } };
    
    vi.mocked(core.getFeatureFlag).mockReturnValue(true);

    const result = useFeatureFlag(mockConfig as any, "flag1");

    expect(() => {
      result.isEnabled.value = false as any;
    }).toThrow();
  });
});