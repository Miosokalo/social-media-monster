import os from "node:os";
import { statfs } from "node:fs/promises";

export type MemorySnapshot = {
  totalBytes: number;
  freeBytes: number;
  usedBytes: number;
  usedPercent: number;
};

export type DiskSnapshot = {
  mountPath: string;
  label: string;
  totalBytes: number;
  freeBytes: number;
  usedBytes: number;
  usedPercent: number;
};

export type SystemOverview = {
  hostname: string;
  platform: string;
  uptimeSeconds: number;
  loadavg: number[];
  cpus: number;
  memory: MemorySnapshot;
  /** Primary disk (first path), for compact UI */
  primaryDisk: DiskSnapshot | null;
  /** All requested paths */
  disks: DiskSnapshot[];
  /** statfs failed for all paths */
  diskUnavailable: boolean;
};

function memorySnapshot(): MemorySnapshot {
  const totalBytes = os.totalmem();
  const freeBytes = os.freemem();
  const usedBytes = Math.max(0, totalBytes - freeBytes);
  const usedPercent = totalBytes > 0 ? (usedBytes / totalBytes) * 100 : 0;
  return { totalBytes, freeBytes, usedBytes, usedPercent };
}

function formatMountLabel(mountPath: string): string {
  if (mountPath === "/" || mountPath === "") return "Root";
  const base = mountPath.replace(/\/$/, "").split("/").pop();
  return base ? base : mountPath;
}

export async function diskSnapshotForPath(mountPath: string): Promise<DiskSnapshot | null> {
  const normalized = mountPath.trim() || "/";
  try {
    const s = await statfs(normalized);
    const fr =
      Number((s as { frsize?: number }).frsize) || Number(s.bsize) || 512;
    const blocks = Number(s.blocks);
    const bavail = Number(s.bavail);
    const totalBytes = blocks * fr;
    const freeBytes = bavail * fr;
    const usedBytes = Math.max(0, totalBytes - freeBytes);
    const usedPercent = totalBytes > 0 ? (usedBytes / totalBytes) * 100 : 0;
    return {
      mountPath: normalized,
      label: formatMountLabel(normalized),
      totalBytes,
      freeBytes,
      usedBytes,
      usedPercent,
    };
  } catch {
    return null;
  }
}

export function parseDiskPaths(raw: string | undefined): string[] {
  if (!raw?.trim()) return ["/"];
  return raw
    .split(",")
    .map((p) => p.trim())
    .filter(Boolean);
}

export async function getSystemOverview(diskPathsCsv?: string): Promise<SystemOverview> {
  const paths = parseDiskPaths(diskPathsCsv);
  const disks: DiskSnapshot[] = [];
  for (const p of paths) {
    const d = await diskSnapshotForPath(p);
    if (d) disks.push(d);
  }
  const memory = memorySnapshot();
  const primaryDisk = disks[0] ?? null;
  return {
    hostname: os.hostname(),
    platform: os.platform(),
    uptimeSeconds: os.uptime(),
    loadavg: os.loadavg(),
    cpus: os.cpus().length,
    memory,
    primaryDisk,
    disks,
    diskUnavailable: paths.length > 0 && disks.length === 0,
  };
}

export function formatBytes(n: number): string {
  if (n >= 1e12) return `${(n / 1e12).toFixed(2)} TB`;
  if (n >= 1e9) return `${(n / 1e9).toFixed(2)} GB`;
  if (n >= 1e6) return `${(n / 1e6).toFixed(1)} MB`;
  if (n >= 1e3) return `${(n / 1e3).toFixed(0)} KB`;
  return `${Math.round(n)} B`;
}

export function formatUptime(seconds: number): string {
  const d = Math.floor(seconds / 86400);
  const h = Math.floor((seconds % 86400) / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  if (d > 0) return `${d}d ${h}h`;
  if (h > 0) return `${h}h ${m}m`;
  return `${m}m`;
}
