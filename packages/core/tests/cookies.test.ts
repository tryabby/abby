import { parseCookies } from "../src/helpers";

describe("cookie parsing", () => {
  it("skips malformed names and values without discarding valid neighbors", () => {
    expect(
      parseCookies(
        "bad%=value; valid=hello%20world; broken=%E0%A4%A; final=yes"
      )
    ).toEqual({
      valid: "hello world",
      final: "yes",
    });
  });
});
