import type { ProjectConfig } from "@/lib/schema";
import { checkProjectHealth, type HealthResult } from "@/lib/health";
import {
  fetchRecentCommits,
  fetchLatestWorkflowRun,
  fetchRecommendedStepsMarkdown,
  type CommitInfo,
  type WorkflowRunInfo,
} from "@/lib/github";
import { fetchLiveVersion } from "@/lib/version-fetch";
import { listDeployEvents, listTickets } from "@/lib/store";

export type ProjectSummary = {
  project: ProjectConfig;
  health: HealthResult;
  ci: WorkflowRunInfo | null;
  ciError?: string;
  /** Latest deploy event from webhook (if any). */
  latestDeploy: Awaited<ReturnType<typeof listDeployEvents>>[0] | null;
  openTicketsCount: number;
};

export async function buildProjectSummary(p: ProjectConfig): Promise<ProjectSummary> {
  const [health, latestDeployList, tickets] = await Promise.all([
    checkProjectHealth(p),
    listDeployEvents(p.id),
    listTickets(p.id),
  ]);
  let ci: WorkflowRunInfo | null = null;
  let ciError: string | undefined;
  try {
    ci = await fetchLatestWorkflowRun(p);
  } catch (e) {
    ciError = e instanceof Error ? e.message : String(e);
  }
  const latestDeploy = latestDeployList[0] ?? null;
  return {
    project: p,
    health,
    ci,
    ciError,
    latestDeploy,
    openTicketsCount: tickets.length,
  };
}

export type ProjectDetail = ProjectSummary & {
  commits: CommitInfo[];
  commitsError?: string;
  recommendedSteps: { content: string; sha: string | null } | null;
  recommendedStepsError?: string;
  liveVersion: Awaited<ReturnType<typeof fetchLiveVersion>>;
  tickets: Awaited<ReturnType<typeof listTickets>>;
  deployEvents: Awaited<ReturnType<typeof listDeployEvents>>;
};

export async function buildProjectDetail(p: ProjectConfig): Promise<ProjectDetail> {
  const summary = await buildProjectSummary(p);
  const [liveVersion, tickets, deployEvents] = await Promise.all([
    fetchLiveVersion(p),
    listTickets(p.id),
    listDeployEvents(p.id),
  ]);

  let commits: CommitInfo[] = [];
  let commitsError: string | undefined;
  try {
    commits = await fetchRecentCommits(p, 15);
  } catch (e) {
    commitsError = e instanceof Error ? e.message : String(e);
  }

  let recommendedSteps: { content: string; sha: string | null } | null = null;
  let recommendedStepsError: string | undefined;
  try {
    recommendedSteps = await fetchRecommendedStepsMarkdown(p);
  } catch (e) {
    recommendedStepsError = e instanceof Error ? e.message : String(e);
  }

  return {
    ...summary,
    commits,
    commitsError,
    recommendedSteps,
    recommendedStepsError,
    liveVersion,
    tickets,
    deployEvents,
  };
}
