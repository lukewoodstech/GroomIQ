import { getSettings } from "../actions/settings";
import { getServices } from "../actions/services";
import { SettingsPageContent } from "./client-components";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { getClientLimit } from "@/lib/stripe";

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

  // Get user with subscription data and client count
  const userData = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: {
      id: true,
      name: true,
      email: true,
      plan: true,
      subscriptionStatus: true,
      _count: {
        select: { clients: true },
      },
    },
  });

  if (!userData) {
    redirect("/login");
  }

  const user = {
    id: userData.id,
    name: userData.name,
    email: userData.email,
    plan: userData.plan,
    subscriptionStatus: userData.subscriptionStatus,
    clientCount: userData._count.clients,
    clientLimit: getClientLimit(userData.plan),
  };

  return <SettingsPageContent settings={settings} services={services} user={user} />;
}
