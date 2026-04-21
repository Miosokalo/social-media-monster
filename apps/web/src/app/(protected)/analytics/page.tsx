import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { AnalyticsClient } from "@/components/analytics-client";

export default async function AnalyticsPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");
  return <AnalyticsClient />;
}
