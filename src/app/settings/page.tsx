import { getSettings } from "../actions/settings";
import { getServices } from "../actions/services";
import { SettingsPageContent } from "./client-components";
import { redirect } from "next/navigation";
import { auth } from "@/auth";

export default async function SettingsPage() {
  const session = await auth();

  if (!session?.user) {
    redirect("/login");
  }

  const settings = await getSettings();
  const services = await getServices();

  if (!settings) {
    redirect("/login");
  }

  const user = {
    id: session.user.id!,
    name: session.user.name || null,
    email: session.user.email!,
  };

  return <SettingsPageContent settings={settings} services={services} user={user} />;
}
