import type { Platform } from "@smm/shared";

export type PublishInput = {
  snapshot: { body?: string; headline?: string };
  accessToken: string;
  /** Page ID for Meta Facebook, etc. */
  externalAccountId: string | null;
};

export type PlatformPublisher = {
  publish: (input: PublishInput) => Promise<string>;
};

export type PlatformKey = Exclude<Platform, "demo">;
