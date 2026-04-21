import type { WorkspaceRole } from "@smm/shared";

const DEFAULT_MAX_PROJECTS = 50;
const DEFAULT_MAX_SCHEDULED_FREE = 500;
const DEFAULT_MAX_SCHEDULED_PAID = 2000;

export function getEffectiveLimits(opts: {
  isFounderService: boolean;
  subscriptionStatus: string | null | undefined;
}) {
  if (opts.isFounderService) {
    return {
      maxProjects: Number.MAX_SAFE_INTEGER,
      maxScheduledPerMonth: Number.MAX_SAFE_INTEGER,
      maxStudioTurnsPerMonth: Number.MAX_SAFE_INTEGER,
    };
  }
  const status = opts.subscriptionStatus ?? "none";
  if (status === "active" || status === "trialing") {
    return {
      maxProjects: DEFAULT_MAX_PROJECTS,
      maxScheduledPerMonth: DEFAULT_MAX_SCHEDULED_PAID,
      maxStudioTurnsPerMonth: 5000,
    };
  }
  return {
    maxProjects: 10,
    maxScheduledPerMonth: DEFAULT_MAX_SCHEDULED_FREE,
    maxStudioTurnsPerMonth: 200,
  };
}

export function canRole(
  role: WorkspaceRole | string,
  action: "manage_billing" | "publish" | "moderate" | "read_analytics",
): boolean {
  const r = role as WorkspaceRole;
  if (r === "owner" || r === "admin") return true;
  if (action === "read_analytics") {
    return r === "analyst" || r === "editor" || r === "moderator";
  }
  if (action === "moderate") {
    return r === "moderator" || r === "editor";
  }
  if (action === "publish") {
    return r === "editor";
  }
  if (action === "manage_billing") {
    return false;
  }
  return false;
}
