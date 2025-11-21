"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { auth } from "@/auth";

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
    const session = await auth();
    if (!session?.user?.id) {
      throw new Error("Unauthorized");
    }
    const userId = session.user.id;

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

    // Verify client exists and belongs to user
    const client = await prisma.client.findFirst({
      where: {
        id: validated.clientId,
        userId,
      },
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
        userId,
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

export async function getPets(page: number = 1, itemsPerPage: number = 20) {
  const session = await auth();
  if (!session?.user?.id) {
    return {
      pets: [],
      total: 0,
      page,
      itemsPerPage,
      totalPages: 0,
    };
  }

  const skip = (page - 1) * itemsPerPage;

  const [pets, total] = await Promise.all([
    prisma.pet.findMany({
      where: { userId: session.user.id },
      skip,
      take: itemsPerPage,
      orderBy: {
        createdAt: "desc",
      },
      include: {
        client: true,
        appointments: true,
      },
    }),
    prisma.pet.count({
      where: { userId: session.user.id },
    }),
  ]);

  return {
    pets,
    total,
    page,
    itemsPerPage,
    totalPages: Math.ceil(total / itemsPerPage),
  };
}

export async function getPet(id: string) {
  const session = await auth();
  if (!session?.user?.id) {
    return null;
  }

  return await prisma.pet.findFirst({
    where: {
      id,
      userId: session.user.id,
    },
    include: {
      client: true,
      appointments: {
        orderBy: { date: "desc" },
      },
    },
  });
}

export async function getClients() {
  const session = await auth();
  if (!session?.user?.id) {
    return [];
  }

  return await prisma.client.findMany({
    where: { userId: session.user.id },
    orderBy: {
      lastName: "asc",
    },
  });
}

export async function updatePet(id: string, formData: FormData) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      throw new Error("Unauthorized");
    }
    const userId = session.user.id;

    // Verify pet belongs to user
    const existingPet = await prisma.pet.findFirst({
      where: { id, userId },
    });

    if (!existingPet) {
      throw new Error("Pet not found");
    }

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

    // Verify client exists and belongs to user
    const client = await prisma.client.findFirst({
      where: {
        id: validated.clientId,
        userId,
      },
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
  const session = await auth();
  if (!session?.user?.id) {
    throw new Error("Unauthorized");
  }

  // Check pet belongs to user and get appointment count
  const pet = await prisma.pet.findFirst({
    where: {
      id,
      userId: session.user.id,
    },
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
