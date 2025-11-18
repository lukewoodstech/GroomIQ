import { getClients } from "../actions/clients";
import { ClientsPageContent } from "./client-components";

export default async function ClientsPage() {
  const clients = await getClients();

  return <ClientsPageContent clients={clients} />;
}
