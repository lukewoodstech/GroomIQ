"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

export async function createPet(formData: FormData) {
  const name = formData.get("name") as string;
  const breed = formData.get("breed") as string | null;
  const species = formData.get("species") as string;
  const age = formData.get("age") ? parseInt(formData.get("age") as string) : null;
  const notes = formData.get("notes") as string | null;
  const clientId = formData.get("clientId") as string;

  if (!name || !species || !clientId) {
    throw new Error("Name, species, and client are required");
  }

  await prisma.pet.create({
    data: {
      name,
      breed: breed || null,
      species,
      age,
      notes: notes || null,
      clientId,
    },
  });

  revalidatePath("/pets");
}

export async function getPets() {
  return await prisma.pet.findMany({
    orderBy: {
      createdAt: "desc",
    },
    include: {
      client: true,
      appointments: true,
    },
  });
}

export async function getClients() {
  return await prisma.client.findMany({
    orderBy: {
      lastName: "asc",
    },
  });
}

export async function updatePet(id: string, formData: FormData) {
  const name = formData.get("name") as string;
  const breed = formData.get("breed") as string | null;
  const species = formData.get("species") as string;
  const age = formData.get("age") ? parseInt(formData.get("age") as string) : null;
  const notes = formData.get("notes") as string | null;
  const clientId = formData.get("clientId") as string;

  if (!name || !species || !clientId) {
    throw new Error("Name, species, and client are required");
  }

  await prisma.pet.update({
    where: { id },
    data: {
      name,
      breed: breed || null,
      species,
      age,
      notes: notes || null,
      clientId,
    },
  });

  revalidatePath("/pets");
}

export async function deletePet(id: string) {
  await prisma.pet.delete({
    where: { id },
  });

  revalidatePath("/pets");
}

