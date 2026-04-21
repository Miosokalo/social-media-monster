import { getEnv } from "@/lib/env";
import type { ProjectConfig } from "@/lib/schema";

const GH = "https://api.github.com";

function authHeaders(): HeadersInit {
  const { GITHUB_TOKEN } = getEnv();
  const h: Record<string, string> = {
    Accept: "application/vnd.github+json",
    "X-GitHub-Api-Version": "2022-11-28",
  };
  if (GITHUB_TOKEN) {
    h.Authorization = `Bearer ${GITHUB_TOKEN}`;
  }
  return h;
}

export type CommitInfo = {
  sha: string;
  shortSha: string;
  message: string;
  author: string | null;
  date: string | null;
  url: string;
};

export async function fetchRecentCommits(
  project: ProjectConfig,
  limit = 12
): Promise<CommitInfo[]> {
  const { owner, repo, branch } = project.git;
  const url = `${GH}/repos/${owner}/${repo}/commits?sha=${encodeURIComponent(branch)}&per_page=${limit}`;
  const res = await fetch(url, { headers: authHeaders(), cache: "no-store" });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`GitHub commits ${res.status}: ${text.slice(0, 200)}`);
  }
  const data = (await res.json()) as Array<{
    sha: string;
    commit: { message: string; author: { name?: string; date?: string } | null };
    html_url: string;
  }>;
  return data.map((c) => ({
    sha: c.sha,
    shortSha: c.sha.slice(0, 7),
    message: c.commit.message.split("\n")[0] ?? c.commit.message,
    author: c.commit.author?.name ?? null,
    date: c.commit.author?.date ?? null,
    url: c.html_url,
  }));
}

export type WorkflowRunInfo = {
  id: number;
  name: string | null;
  status: string;
  conclusion: string | null;
  htmlUrl: string;
  createdAt: string;
  updatedAt: string;
  headSha: string | null;
  event: string;
};

export async function fetchLatestWorkflowRun(
  project: ProjectConfig
): Promise<WorkflowRunInfo | null> {
  const { owner, repo, branch } = project.git;
  const params = new URLSearchParams({
    branch,
    per_page: "5",
  });
  const url = `${GH}/repos/${owner}/${repo}/actions/runs?${params}`;
  const res = await fetch(url, { headers: authHeaders(), cache: "no-store" });
  if (res.status === 404) {
    return null;
  }
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`GitHub actions ${res.status}: ${text.slice(0, 200)}`);
  }
  const body = (await res.json()) as {
    workflow_runs: Array<{
      id: number;
      name: string | null;
      status: string;
      conclusion: string | null;
      html_url: string;
      created_at: string;
      updated_at: string;
      head_sha: string | null;
      event: string;
      path?: string;
    }>;
  };
  let runs = body.workflow_runs;
  const wf = project.ci?.workflowFile;
  const wn = project.ci?.workflowName;
  if (wf) {
    const filtered = runs.filter((r) => {
      const p = (r as { path?: string }).path;
      return p?.endsWith(wf) ?? false;
    });
    if (filtered.length) runs = filtered;
  }
  if (wn) {
    const filtered = runs.filter((r) =>
      (r.name ?? "").toLowerCase().includes(wn.toLowerCase())
    );
    if (filtered.length) runs = filtered;
  }
  const run = runs[0];
  if (!run) return null;
  return {
    id: run.id,
    name: run.name,
    status: run.status,
    conclusion: run.conclusion,
    htmlUrl: run.html_url,
    createdAt: run.created_at,
    updatedAt: run.updated_at,
    headSha: run.head_sha,
    event: run.event,
  };
}

export async function fetchRecommendedStepsMarkdown(
  project: ProjectConfig
): Promise<{ content: string; sha: string | null } | null> {
  const { owner, repo, branch } = project.git;
  const filePath = project.recommendedStepsPath;
  const encodedPath = filePath
    .split("/")
    .filter(Boolean)
    .map(encodeURIComponent)
    .join("/");
  const url = `${GH}/repos/${owner}/${repo}/contents/${encodedPath}?ref=${encodeURIComponent(branch)}`;
  const res = await fetch(url, { headers: authHeaders(), cache: "no-store" });
  if (res.status === 404) {
    return null;
  }
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`GitHub file ${res.status}: ${text.slice(0, 200)}`);
  }
  const data = (await res.json()) as {
    encoding: string;
    content: string;
    sha?: string;
  };
  if (data.encoding !== "base64") {
    return null;
  }
  const buf = Buffer.from(data.content.replace(/\n/g, ""), "base64");
  return { content: buf.toString("utf8"), sha: data.sha ?? null };
}
