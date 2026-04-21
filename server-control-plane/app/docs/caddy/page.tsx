import Link from "next/link";
import fs from "node:fs/promises";
import path from "node:path";
import ReactMarkdown from "react-markdown";

export default async function CaddyDocPage() {
  const file = path.join(
    /* turbopackIgnore: true */ process.cwd(),
    "docs",
    "CADDY.md"
  );
  const content = await fs.readFile(file, "utf8");
  return (
    <div className="min-h-screen bg-zinc-950 px-4 py-10 text-zinc-100">
      <div className="mx-auto max-w-3xl">
        <Link href="/" className="text-sm text-indigo-400 hover:text-indigo-300">
          ← Zur Übersicht
        </Link>
        <article className="prose prose-invert prose-sm mt-6 max-w-none prose-headings:text-zinc-100 prose-p:text-zinc-300 prose-li:text-zinc-300 prose-code:text-amber-200">
          <ReactMarkdown>{content}</ReactMarkdown>
        </article>
      </div>
    </div>
  );
}
