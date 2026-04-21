import { notFound, redirect } from "next/navigation";
import { auth } from "@/auth";
import { StudioClient } from "@/components/studio-client";

export default async function StudioProjectPage({
  params,
}: {
  params: Promise<{ projectId: string }>;
}) {
  const session = await auth();
  if (!session?.user) redirect("/login");
  const { projectId } = await params;
  if (!projectId) notFound();
  return <StudioClient projectId={projectId} />;
}
