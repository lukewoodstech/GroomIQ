import { getSettings } from "../actions/settings";
import { getServices } from "../actions/services";
import { SettingsPageContent } from "./client-components";
import { redirect } from "next/navigation";

export default async function SettingsPage() {
  const settings = await getSettings();
  const services = await getServices();

  if (!settings) {
    redirect("/login");
  }

  return <SettingsPageContent settings={settings} services={services} />;
}
