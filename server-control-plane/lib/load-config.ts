import fs from "node:fs/promises";
import path from "node:path";
import { parse as parseYaml } from "yaml";
import { projectsFileSchema, type ProjectConfig } from "@/lib/schema";
import { getEnv } from "@/lib/env";

let cachedProjects: ProjectConfig[] | null = null;
let cachedMtime = 0;

export async function loadProjectsConfig(): Promise<ProjectConfig[]> {
  const { PROJECTS_CONFIG_PATH } = getEnv();
  const resolved = path.join(
    /* turbopackIgnore: true */ process.cwd(),
    PROJECTS_CONFIG_PATH
  );
  const st = await fs.stat(resolved).catch(() => null);
  if (!st) {
    throw new Error(`Projects config not found: ${resolved}`);
  }
  if (cachedProjects && st.mtimeMs === cachedMtime) {
    return cachedProjects;
  }
  const raw = await fs.readFile(resolved, "utf8");
  const parsed = parseYaml(raw);
  const data = projectsFileSchema.parse(parsed);
  cachedProjects = data.projects;
  cachedMtime = st.mtimeMs;
  return cachedProjects;
}

export async function getProjectById(id: string): Promise<ProjectConfig | null> {
  const projects = await loadProjectsConfig();
  return projects.find((p) => p.id === id) ?? null;
}
