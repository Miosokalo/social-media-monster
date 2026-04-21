import { z } from "zod";

const gitSchema = z.object({
  provider: z.enum(["github"]).default("github"),
  owner: z.string().min(1),
  repo: z.string().min(1),
  branch: z.string().default("main"),
});

const urlsSchema = z.object({
  public: z.string().url(),
  healthCheck: z.string().url().optional(),
});

const versionSchema = z
  .object({
    url: z.string().url().optional(),
  })
  .optional();

const ciSchema = z
  .object({
    /** If set, filter workflow runs by workflow file path suffix (e.g. deploy.yml). */
    workflowFile: z.string().optional(),
    /** If set, prefer runs whose workflow display name matches (substring). */
    workflowName: z.string().optional(),
  })
  .optional();

export const projectSchema = z.object({
  id: z
    .string()
    .min(1)
    .regex(/^[a-z0-9][a-z0-9-]*$/i, "id must be alphanumeric with hyphens"),
  displayName: z.string().min(1),
  git: gitSchema,
  /** Path in repo to recommended steps (Markdown). */
  recommendedStepsPath: z.string().default("recommended_steps.md"),
  urls: urlsSchema,
  version: versionSchema,
  ci: ciSchema,
});

export const projectsFileSchema = z.object({
  projects: z.array(projectSchema).min(1),
});

export type ProjectConfig = z.infer<typeof projectSchema>;
export type ProjectsFile = z.infer<typeof projectsFileSchema>;
