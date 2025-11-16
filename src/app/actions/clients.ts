"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

export async function createClient(formData: FormData) {
  const firstName = formData.get("firstName") as string;
  const lastName = formData.get("lastName") as string;
  const email = formData.get("email") as string | null;
  const phone = formData.get("phone") as string | null;

  if (!firstName || !lastName) {
    throw new Error("First name and last name are required");
  }

  await prisma.client.create({
    data: {
      firstName,
      lastName,
      email: email || null,
      phone: phone || null,
    },
  });

  revalidatePath("/clients");
}

export async function getClients() {
  return await prisma.client.findMany({
    orderBy: {
      createdAt: "desc",
    },
    include: {
      pets: true,
    },
  });
}

