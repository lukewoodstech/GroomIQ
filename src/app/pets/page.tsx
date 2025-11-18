import { getPets, getClients } from "../actions/pets";
import { PetsPageContent } from "./client-components";

export default async function PetsPage() {
  const pets = await getPets();
  const clients = await getClients();

  return <PetsPageContent pets={pets} clients={clients} />;
}
