import { getSettings } from "../actions/settings";
import { SettingsPageContent } from "./client-components";

export default async function SettingsPage() {
  const settings = await getSettings();

  return <SettingsPageContent settings={settings} />;
}
