import type { WorkflowRunInfo } from "@/lib/github";

export type CiTone = "neutral" | "good" | "bad" | "progress";

export function describeCi(run: WorkflowRunInfo | null): { label: string; tone: CiTone } {
  if (!run) {
    return { label: "Kein CI-Lauf gefunden", tone: "neutral" };
  }
  if (run.status === "queued" || run.status === "in_progress" || run.status === "waiting") {
    return { label: "CI läuft…", tone: "progress" };
  }
  if (run.status !== "completed") {
    return { label: `CI: ${run.status}`, tone: "neutral" };
  }
  const c = run.conclusion;
  if (c === "success") {
    return { label: "Letzter CI: erfolgreich", tone: "good" };
  }
  if (c === "failure" || c === "timed_out") {
    return { label: "Letzter CI: fehlgeschlagen", tone: "bad" };
  }
  if (c === "cancelled" || c === "skipped" || c === "neutral") {
    return { label: `Letzter CI: ${c ?? "ohne Ergebnis"}`, tone: "neutral" };
  }
  return { label: `Letzter CI: ${c ?? run.status}`, tone: "neutral" };
}

export function describeDeployStatus(
  status: "building" | "success" | "failure" | "cancelled"
): { label: string; tone: CiTone } {
  switch (status) {
    case "building":
      return { label: "Deploy/Build läuft", tone: "progress" };
    case "success":
      return { label: "Letzter Deploy: OK", tone: "good" };
    case "failure":
      return { label: "Letzter Deploy: Fehler", tone: "bad" };
    case "cancelled":
      return { label: "Letzter Deploy: abgebrochen", tone: "neutral" };
    default:
      return { label: String(status), tone: "neutral" };
  }
}
