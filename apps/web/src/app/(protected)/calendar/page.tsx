import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { CalendarClient } from "@/components/calendar-client";

export default async function CalendarPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");
  return <CalendarClient />;
}
