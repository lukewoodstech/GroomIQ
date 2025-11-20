"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { z } from "zod";

// Validation schema
const petSchema = z.object({
  name: z.string().min(1, "Pet name is required").max(100, "Name is too long"),
  breed: z
    .string()
    .max(100, "Breed name is too long")
    .optional()
    .or(z.literal(""))
    .transform((val) => (val === "" ? null : val)),
  species: z.enum(["dog", "cat", "other"], { message: "Please select a species" }),
  age: z
    .number()
    .int("Age must be a whole number")
    .min(0, "Age cannot be negative")
    .max(50, "Age seems unrealistic")
    .nullable()
    .optional(),
  notes: z
    .string()
    .max(1000, "Notes are too long")
    .optional()
    .or(z.literal(""))
    .transform((val) => (val === "" ? null : val)),
  clientId: z.string().min(1, "Owner is required"),
});

export async function createPet(formData: FormData) {
  try {
    const ageValue = formData.get("age");
    const rawData = {
      name: formData.get("name"),
      breed: formData.get("breed") || "",
      species: formData.get("species"),
      age: ageValue && ageValue !== "" ? Number(ageValue) : null,
      notes: formData.get("notes") || "",
      clientId: formData.get("clientId"),
    };

    const validated = petSchema.parse(rawData);

    // Verify client exists
    const client = await prisma.client.findUnique({
      where: { id: validated.clientId },
    });

    if (!client) {
      throw new Error("Selected owner not found");
    }

    await prisma.pet.create({
      data: {
        name: validated.name,
        breed: validated.breed,
        species: validated.species,
        age: validated.age,
        notes: validated.notes,
        clientId: validated.clientId,
      },
    });

    revalidatePath("/pets", "layout");
    return { success: true };
  } catch (error) {
    if (error instanceof z.ZodError) {
      throw new Error(error.issues[0].message);
    }
    throw error;
  }
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

export async function getPet(id: string) {
  return await prisma.pet.findUnique({
    where: { id },
    include: {
      client: true,
      appointments: {
        orderBy: { date: "desc" },
      },
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
  try {
    const ageValue = formData.get("age");
    const rawData = {
      name: formData.get("name"),
      breed: formData.get("breed") || "",
      species: formData.get("species"),
      age: ageValue && ageValue !== "" ? Number(ageValue) : null,
      notes: formData.get("notes") || "",
      clientId: formData.get("clientId"),
    };

    const validated = petSchema.parse(rawData);

    // Verify client exists
    const client = await prisma.client.findUnique({
      where: { id: validated.clientId },
    });

    if (!client) {
      throw new Error("Selected owner not found");
    }

    await prisma.pet.update({
      where: { id },
      data: {
        name: validated.name,
        breed: validated.breed,
        species: validated.species,
        age: validated.age,
        notes: validated.notes,
        clientId: validated.clientId,
      },
    });

    revalidatePath("/pets", "layout");
    return { success: true };
  } catch (error) {
    if (error instanceof z.ZodError) {
      throw new Error(error.issues[0].message);
    }
    throw error;
  }
}

export async function deletePet(id: string) {
  // Check appointment count before deletion
  const pet = await prisma.pet.findUnique({
    where: { id },
    include: {
      _count: {
        select: { appointments: true },
      },
    },
  });

  if (!pet) {
    throw new Error("Pet not found");
  }

  await prisma.pet.delete({
    where: { id },
  });

  revalidatePath("/pets", "layout");
  return {
    success: true,
    message:
      pet._count.appointments > 0
        ? `Deleted pet and ${pet._count.appointments} associated appointment(s)`
        : undefined,
  };
}
