import type { ReactNode } from "react";

export function EmptyState({
  title,
  children,
}: {
  title: string;
  children?: ReactNode;
}) {
  return (
    <div className="rounded-xl border border-dashed border-zinc-700 px-6 py-12 text-center">
      <p className="text-sm font-medium text-zinc-400">{title}</p>
      {children ? (
        <div className="mt-3 text-sm text-zinc-500">{children}</div>
      ) : null}
    </div>
  );
}
