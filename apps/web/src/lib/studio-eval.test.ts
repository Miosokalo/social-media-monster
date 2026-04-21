import { describe, expect, it } from "vitest";
import { messageForApiStatus } from "@/lib/http-error-messages";
import { studioChatModeSchema } from "@smm/shared";

describe("studio modes", () => {
  it("accepts chat_only, doc_only, both", () => {
    expect(studioChatModeSchema.safeParse("both").success).toBe(true);
    expect(studioChatModeSchema.safeParse("chat_only").success).toBe(true);
    expect(studioChatModeSchema.safeParse("doc_only").success).toBe(true);
  });
});

describe("http error messages", () => {
  it("maps quota", () => {
    expect(messageForApiStatus(402, "quota_publish")).toContain("Limit");
  });
});
