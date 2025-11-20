import { getClients } from "../actions/clients";
import { ClientsPageContent } from "./client-components";

export default async function ClientsPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string }>;
}) {
  const params = await searchParams;
  const page = Number(params.page) || 1;
  const data = await getClients(page);

  return <ClientsPageContent {...data} />;
}
