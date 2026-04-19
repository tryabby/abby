import { describe, it, expect, vi, beforeEach } from "vitest";
import { useAbby } from "../use-abby";
import * as core from "@tryabby/core";

vi.mock("@tryabby/core");

describe("useAbby", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should initialize with variant", () => {
    const mockConfig = { tests: { test1: {} } };
    const mockActFn = vi.fn();
    
    vi.mocked(core.getVariant).mockReturnValue("control");
    vi.mocked(core.getAct).mockReturnValue(mockActFn);

    const result = useAbby(mockConfig as any, "test1");

    expect(result.variant.value).toBe("control");
    expect(result.onAct).toBeDefined();
  });

  it("should call act function with data", () => {
    const mockConfig = { tests: { test1: {} } };
    const mockActFn = vi.fn();
    
    vi.mocked(core.getVariant).mockReturnValue("treatment");
    vi.mocked(core.getAct).mockReturnValue(mockActFn);

    const result = useAbby(mockConfig as any, "test1");
    const data = { userId: "123" };

    result.onAct(data);

    expect(mockActFn).toHaveBeenCalledWith("test1", data);
  });

  it("should throw error when config is missing", () => {
    expect(() => useAbby(null as any, "test1")).toThrow(
      "Abby config is required"
    );
  });

  it("should throw error when test name is missing", () => {
    const mockConfig = { tests: {} };
    
    expect(() => useAbby(mockConfig as any, "" as any)).toThrow(
      "Test name is required"
    );
  });

  it("should handle core errors gracefully", () => {
    const mockConfig = { tests: { test1: {} } };
    
    vi.mocked(core.getVariant).mockImplementation(() => {
      throw new Error("Test not found");
    });

    expect(() => useAbby(mockConfig as any, "test1")).toThrow(
      'Failed to initialize useAbby for test "test1"'
    );
  });

  it("should warn when act function is not available", () => {
    const consoleWarnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});
    const mockConfig = { tests: { test1: {} } };
    
    vi.mocked(core.getVariant).mockReturnValue("control");
    vi.mocked(core.getAct).mockReturnValue(undefined as any);

    const result = useAbby(mockConfig as any, "test1");
    result.onAct({});

    expect(consoleWarnSpy).toHaveBeenCalledWith(
      "Act function not available in Abby config"
    );

    consoleWarnSpy.mockRestore();
  });

  it("should return readonly ref", () => {
    const mockConfig = { tests: { test1: {} } };
    const mockActFn = vi.fn();
    
    vi.mocked(core.getVariant).mockReturnValue("control");
    vi.mocked(core.getAct).mockReturnValue(mockActFn);

    const result = useAbby(mockConfig as any, "test1");

    expect(() => {
      result.variant.value = "treatment" as any;
    }).toThrow();
  });
});