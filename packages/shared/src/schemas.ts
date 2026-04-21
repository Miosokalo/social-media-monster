import { z } from "zod";

export const workspaceRoleSchema = z.enum([
  "owner",
  "admin",
  "editor",
  "analyst",
  "moderator",
]);

export type WorkspaceRole = z.infer<typeof workspaceRoleSchema>;

export const studioChatModeSchema = z.enum(["both", "chat_only", "doc_only"]);

export type StudioChatMode = z.infer<typeof studioChatModeSchema>;

export const channelVariantPayloadSchema = z.object({
  headline: z.string().optional(),
  body: z.string(),
  hashtags: z.array(z.string()).optional(),
  firstComment: z.string().optional(),
  threadParts: z.array(z.string()).optional(),
  notes: z.string().optional(),
});

export type ChannelVariantPayload = z.infer<typeof channelVariantPayloadSchema>;

export const scheduledPostStatusSchema = z.enum([
  "draft",
  "scheduled",
  "queued",
  "publishing",
  "published",
  "failed",
  "cancelled",
]);

export type ScheduledPostStatus = z.infer<typeof scheduledPostStatusSchema>;

export const platformSchema = z.enum([
  "meta_facebook",
  "meta_instagram",
  "linkedin",
  "x",
  "tiktok",
  "youtube",
  "demo",
]);

export type Platform = z.infer<typeof platformSchema>;
