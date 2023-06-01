import { expect, test, describe } from "vitest"

describe("it works", () => {
    test("test", () => {
        console.log("test running")
        expect(true, "ja").toBeTruthy();
    })
}
)