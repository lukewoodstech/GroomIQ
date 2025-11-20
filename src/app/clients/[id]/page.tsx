import { notFound } from "next/navigation";
import { getClient } from "../../actions/clients";
import { ClientDetailContent } from "./client-components";

export default async function ClientDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const client = await getClient(id);

  if (!client) {
    notFound();
  }

  return <ClientDetailContent client={client} />;
}
