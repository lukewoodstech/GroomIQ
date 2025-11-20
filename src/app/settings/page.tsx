import { getSettings } from "../actions/settings";
import { getServices } from "../actions/services";
import { SettingsPageContent } from "./client-components";

export default async function SettingsPage() {
  const settings = await getSettings();
  const services = await getServices();

  return <SettingsPageContent settings={settings} services={services} />;
}
