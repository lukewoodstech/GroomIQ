import { notFound } from "next/navigation";
import { getPet } from "../../actions/pets";
import { PetDetailContent } from "./pet-detail-components";

export default async function PetDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const pet = await getPet(id);

  if (!pet) {
    notFound();
  }

  return <PetDetailContent pet={pet} />;
}
