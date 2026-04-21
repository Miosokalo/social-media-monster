import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { InboxClient } from "@/components/inbox-client";

export default async function InboxPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");
  return <InboxClient />;
}
