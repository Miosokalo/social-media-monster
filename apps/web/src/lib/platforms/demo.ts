import { nanoid } from "nanoid";

export async function publishDemo(opts: {
  snapshot: { body?: string; headline?: string };
}): Promise<string> {
  const id = nanoid();
  void opts;
  return `demo_${id}`;
}
