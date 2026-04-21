import fs from "node:fs/promises";
import path from "node:path";
import { nanoid } from "nanoid";
import { getEnv } from "@/lib/env";

export type DeployEvent = {
  id: string;
  projectId: string;
  status: "building" | "success" | "failure" | "cancelled";
  commit?: string;
  message?: string;
  at: string;
  source?: string;
};

export type TicketRecord = {
  id: string;
  projectId: string;
  title: string;
  body?: string;
  severity?: "info" | "warning" | "error";
  source?: string;
  createdAt: string;
};

type StoreShape = {
  deployEvents: DeployEvent[];
  tickets: TicketRecord[];
};

const MAX_DEPLOY = 200;
const MAX_TICKETS = 500;

async function storePath(): Promise<string> {
  const { CONTROL_PLANE_DATA_DIR } = getEnv();
  const dir = path.join(
    /* turbopackIgnore: true */ process.cwd(),
    CONTROL_PLANE_DATA_DIR
  );
  await fs.mkdir(dir, { recursive: true });
  return path.join(dir, "store.json");
}

async function readStore(): Promise<StoreShape> {
  const p = await storePath();
  try {
    const raw = await fs.readFile(p, "utf8");
    const parsed = JSON.parse(raw) as StoreShape;
    return {
      deployEvents: Array.isArray(parsed.deployEvents) ? parsed.deployEvents : [],
      tickets: Array.isArray(parsed.tickets) ? parsed.tickets : [],
    };
  } catch {
    return { deployEvents: [], tickets: [] };
  }
}

async function writeStore(data: StoreShape): Promise<void> {
  const p = await storePath();
  await fs.writeFile(p, JSON.stringify(data, null, 2), "utf8");
}

export async function appendDeployEvent(
  ev: Omit<DeployEvent, "id" | "at"> & { at?: string }
): Promise<DeployEvent> {
  const store = await readStore();
  const row: DeployEvent = {
    id: nanoid(),
    projectId: ev.projectId,
    status: ev.status,
    commit: ev.commit,
    message: ev.message,
    at: ev.at ?? new Date().toISOString(),
    source: ev.source,
  };
  store.deployEvents.unshift(row);
  store.deployEvents = store.deployEvents.slice(0, MAX_DEPLOY);
  await writeStore(store);
  return row;
}

export async function appendTicket(
  t: Omit<TicketRecord, "id" | "createdAt">
): Promise<TicketRecord> {
  const store = await readStore();
  const row: TicketRecord = {
    id: nanoid(),
    projectId: t.projectId,
    title: t.title,
    body: t.body,
    severity: t.severity,
    source: t.source,
    createdAt: new Date().toISOString(),
  };
  store.tickets.unshift(row);
  store.tickets = store.tickets.slice(0, MAX_TICKETS);
  await writeStore(store);
  return row;
}

export async function listDeployEvents(projectId?: string): Promise<DeployEvent[]> {
  const store = await readStore();
  const list = store.deployEvents;
  if (!projectId) return list;
  return list.filter((e) => e.projectId === projectId);
}

export async function listTickets(projectId?: string): Promise<TicketRecord[]> {
  const store = await readStore();
  const list = store.tickets;
  if (!projectId) return list;
  return list.filter((t) => t.projectId === projectId);
}
