import {
  boolean,
  integer,
  jsonb,
  pgEnum,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";

export const workspaceRoleEnum = pgEnum("workspace_role", [
  "owner",
  "admin",
  "editor",
  "analyst",
  "moderator",
]);

export const platformEnum = pgEnum("platform", [
  "meta_facebook",
  "meta_instagram",
  "linkedin",
  "x",
  "tiktok",
  "youtube",
  "demo",
]);

export const scheduledPostStatusEnum = pgEnum("scheduled_post_status", [
  "draft",
  "scheduled",
  "queued",
  "publishing",
  "published",
  "failed",
  "cancelled",
]);

export const inboxItemStatusEnum = pgEnum("inbox_item_status", [
  "open",
  "in_progress",
  "done",
  "spam",
]);

export const users = pgTable("users", {
  id: uuid("id").primaryKey().defaultRandom(),
  email: text("email").notNull().unique(),
  name: text("name"),
  passwordHash: text("password_hash"),
  emailVerified: timestamp("email_verified"),
  isFounderService: boolean("is_founder_service").notNull().default(false),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const workspaces = pgTable("workspaces", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: text("name").notNull(),
  slug: text("slug").notNull().unique(),
  stripeCustomerId: text("stripe_customer_id"),
  subscriptionStatus: text("subscription_status").default("none"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const workspaceMembers = pgTable(
  "workspace_members",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    workspaceId: uuid("workspace_id")
      .notNull()
      .references(() => workspaces.id, { onDelete: "cascade" }),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    role: workspaceRoleEnum("role").notNull().default("editor"),
    createdAt: timestamp("created_at").notNull().defaultNow(),
  },
  (t) => ({
    uniq: uniqueIndex("wm_workspace_user").on(t.workspaceId, t.userId),
  }),
);

export const brandEntities = pgTable("brand_entities", {
  id: uuid("id").primaryKey().defaultRandom(),
  workspaceId: uuid("workspace_id")
    .notNull()
    .references(() => workspaces.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  slug: text("slug").notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const connectedAccounts = pgTable("connected_accounts", {
  id: uuid("id").primaryKey().defaultRandom(),
  brandEntityId: uuid("brand_entity_id")
    .notNull()
    .references(() => brandEntities.id, { onDelete: "cascade" }),
  platform: platformEnum("platform").notNull(),
  label: text("label").notNull(),
  externalAccountId: text("external_account_id"),
  accessTokenEnc: text("access_token_enc"),
  refreshTokenEnc: text("refresh_token_enc"),
  expiresAt: timestamp("expires_at"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const contentProjects = pgTable("content_projects", {
  id: uuid("id").primaryKey().defaultRandom(),
  workspaceId: uuid("workspace_id")
    .notNull()
    .references(() => workspaces.id, { onDelete: "cascade" }),
  brandEntityId: uuid("brand_entity_id").references(() => brandEntities.id, {
    onDelete: "set null",
  }),
  title: text("title").notNull(),
  status: text("status").notNull().default("active"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const chatMessages = pgTable("chat_messages", {
  id: uuid("id").primaryKey().defaultRandom(),
  projectId: uuid("project_id")
    .notNull()
    .references(() => contentProjects.id, { onDelete: "cascade" }),
  role: text("role").notNull(),
  content: text("content").notNull(),
  mode: text("mode"),
  toolCallsJson: jsonb("tool_calls_json"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const workingDocumentRevisions = pgTable("working_document_revisions", {
  id: uuid("id").primaryKey().defaultRandom(),
  projectId: uuid("project_id")
    .notNull()
    .references(() => contentProjects.id, { onDelete: "cascade" }),
  contentMd: text("content_md").notNull(),
  revision: integer("revision").notNull(),
  createdBy: uuid("created_by").references(() => users.id),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const mediaAssets = pgTable("media_assets", {
  id: uuid("id").primaryKey().defaultRandom(),
  workspaceId: uuid("workspace_id")
    .notNull()
    .references(() => workspaces.id, { onDelete: "cascade" }),
  storageKey: text("storage_key").notNull(),
  mimeType: text("mime_type").notNull(),
  byteSize: integer("byte_size").notNull().default(0),
  source: text("source").notNull(),
  prompt: text("prompt"),
  width: integer("width"),
  height: integer("height"),
  thumbnailKey: text("thumbnail_key"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const metaPosts = pgTable("meta_posts", {
  id: uuid("id").primaryKey().defaultRandom(),
  projectId: uuid("project_id")
    .notNull()
    .references(() => contentProjects.id, { onDelete: "cascade" }),
  title: text("title").notNull(),
  body: text("body").notNull(),
  characterCount: integer("character_count").notNull(),
  primaryMediaId: uuid("primary_media_id").references(() => mediaAssets.id, {
    onDelete: "set null",
  }),
  sourceSectionLabel: text("source_section_label"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const channelVariants = pgTable("channel_variants", {
  id: uuid("id").primaryKey().defaultRandom(),
  metaPostId: uuid("meta_post_id")
    .notNull()
    .references(() => metaPosts.id, { onDelete: "cascade" }),
  connectedAccountId: uuid("connected_account_id").references(
    () => connectedAccounts.id,
    { onDelete: "set null" },
  ),
  platform: platformEnum("platform").notNull(),
  payload: jsonb("payload").notNull(),
  status: text("status").notNull().default("draft"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const scheduledPosts = pgTable("scheduled_posts", {
  id: uuid("id").primaryKey().defaultRandom(),
  workspaceId: uuid("workspace_id")
    .notNull()
    .references(() => workspaces.id, { onDelete: "cascade" }),
  brandEntityId: uuid("brand_entity_id").references(() => brandEntities.id, {
    onDelete: "set null",
  }),
  channelVariantId: uuid("channel_variant_id").references(
    () => channelVariants.id,
    { onDelete: "set null" },
  ),
  connectedAccountId: uuid("connected_account_id").references(
    () => connectedAccounts.id,
    { onDelete: "set null" },
  ),
  platform: platformEnum("platform").notNull(),
  contentSnapshot: jsonb("content_snapshot").notNull(),
  scheduledFor: timestamp("scheduled_for"),
  status: scheduledPostStatusEnum("status").notNull().default("draft"),
  attemptCount: integer("attempt_count").notNull().default(0),
  lastError: text("last_error"),
  externalPostId: text("external_post_id"),
  /** Dedup key for idempotent publish (worker restarts). */
  idempotencyKey: text("idempotency_key").unique(),
  publishedAt: timestamp("published_at"),
  approvalStatus: text("approval_status").notNull().default("approved"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const moderationRules = pgTable("moderation_rules", {
  id: uuid("id").primaryKey().defaultRandom(),
  workspaceId: uuid("workspace_id")
    .notNull()
    .references(() => workspaces.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  matchType: text("match_type").notNull(),
  pattern: text("pattern").notNull(),
  action: text("action").notNull(),
  active: boolean("active").notNull().default(true),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const inboxItems = pgTable("inbox_items", {
  id: uuid("id").primaryKey().defaultRandom(),
  workspaceId: uuid("workspace_id")
    .notNull()
    .references(() => workspaces.id, { onDelete: "cascade" }),
  connectedAccountId: uuid("connected_account_id").references(
    () => connectedAccounts.id,
    { onDelete: "set null" },
  ),
  platform: platformEnum("platform").notNull(),
  externalId: text("external_id").notNull(),
  kind: text("kind").notNull(),
  snippet: text("snippet"),
  payload: jsonb("payload"),
  status: inboxItemStatusEnum("status").notNull().default("open"),
  assignedUserId: uuid("assigned_user_id").references(() => users.id),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const analyticsSnapshots = pgTable("analytics_snapshots", {
  id: uuid("id").primaryKey().defaultRandom(),
  workspaceId: uuid("workspace_id")
    .notNull()
    .references(() => workspaces.id, { onDelete: "cascade" }),
  connectedAccountId: uuid("connected_account_id").references(
    () => connectedAccounts.id,
    { onDelete: "set null" },
  ),
  periodStart: timestamp("period_start").notNull(),
  periodEnd: timestamp("period_end").notNull(),
  metrics: jsonb("metrics").notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const auditLogs = pgTable("audit_logs", {
  id: uuid("id").primaryKey().defaultRandom(),
  workspaceId: uuid("workspace_id")
    .notNull()
    .references(() => workspaces.id, { onDelete: "cascade" }),
  userId: uuid("user_id").references(() => users.id, { onDelete: "set null" }),
  action: text("action").notNull(),
  entityType: text("entity_type").notNull(),
  entityId: text("entity_id"),
  metadata: jsonb("metadata"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const usageMonthly = pgTable(
  "usage_monthly",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    workspaceId: uuid("workspace_id")
      .notNull()
      .references(() => workspaces.id, { onDelete: "cascade" }),
    monthKey: text("month_key").notNull(),
    postsPublished: integer("posts_published").notNull().default(0),
    studioMessages: integer("studio_messages").notNull().default(0),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
  },
  (t) => ({
    uniq: uniqueIndex("usage_monthly_ws_month").on(t.workspaceId, t.monthKey),
  }),
);

/** Short-lived store for multi-step OAuth (e.g. Meta page picker). */
export const oauthConnectSessions = pgTable("oauth_connect_sessions", {
  id: text("id").primaryKey(),
  brandEntityId: uuid("brand_entity_id")
    .notNull()
    .references(() => brandEntities.id, { onDelete: "cascade" }),
  provider: text("provider").notNull(),
  payloadEnc: text("payload_enc").notNull(),
  expiresAt: timestamp("expires_at").notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const usersRelations = relations(users, ({ many }) => ({
  workspaceMembers: many(workspaceMembers),
}));

export const workspacesRelations = relations(workspaces, ({ many }) => ({
  members: many(workspaceMembers),
  brandEntities: many(brandEntities),
}));

export const workspaceMembersRelations = relations(
  workspaceMembers,
  ({ one }) => ({
    workspace: one(workspaces, {
      fields: [workspaceMembers.workspaceId],
      references: [workspaces.id],
    }),
    user: one(users, {
      fields: [workspaceMembers.userId],
      references: [users.id],
    }),
  }),
);

export const contentProjectsRelations = relations(
  contentProjects,
  ({ one, many }) => ({
    workspace: one(workspaces, {
      fields: [contentProjects.workspaceId],
      references: [workspaces.id],
    }),
    messages: many(chatMessages),
    revisions: many(workingDocumentRevisions),
    metaPosts: many(metaPosts),
  }),
);

export const metaPostsRelations = relations(metaPosts, ({ one, many }) => ({
  project: one(contentProjects, {
    fields: [metaPosts.projectId],
    references: [contentProjects.id],
  }),
  primaryMedia: one(mediaAssets, {
    fields: [metaPosts.primaryMediaId],
    references: [mediaAssets.id],
  }),
  variants: many(channelVariants),
}));
