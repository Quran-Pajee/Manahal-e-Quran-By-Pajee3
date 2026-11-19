import type { Metadata } from "next";
import { SettingsView } from "@/components/app/Settings";
import { appLang, requireUser } from "@/lib/users";

export const metadata: Metadata = { title: "Settings" };

export default async function SettingsPage({ searchParams }: { searchParams: Promise<{ profile?: string; pw?: string }> }) {
  const user = await requireUser("portal");
  return <SettingsView lang={await appLang()} user={user} query={await searchParams} />;
}
