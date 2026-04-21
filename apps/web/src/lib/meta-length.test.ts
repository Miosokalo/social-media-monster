import { describe, expect, it } from "vitest";
import { charCount, isMetaLengthOk } from "@/lib/meta-length";

describe("meta-length", () => {
  it("counts unicode code points", () => {
    expect(charCount("a💩b")).toBe(3);
  });
  it("validates band", () => {
    const s = "x".repeat(4000);
    expect(isMetaLengthOk(s)).toBe(true);
    expect(isMetaLengthOk("x".repeat(100))).toBe(false);
  });
});
