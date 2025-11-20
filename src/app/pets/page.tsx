import { getPets, getClients } from "../actions/pets";
import { PetsPageContent } from "./client-components";

export default async function PetsPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string }>;
}) {
  const params = await searchParams;
  const page = Number(params.page) || 1;
  const data = await getPets(page);
  const clients = await getClients();

  return <PetsPageContent {...data} clients={clients} />;
}
