"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { auth } from "@/auth";

// Validation schema
const serviceSchema = z.object({
  name: z.string().min(1, "Service name is required").max(100, "Name is too long"),
  duration: z
    .number()
    .int("Duration must be a whole number")
    .min(15, "Duration must be at least 15 minutes")
    .max(480, "Duration cannot exceed 8 hours"),
  price: z.number().min(0, "Price cannot be negative").nullable().optional(),
  description: z
    .string()
    .max(500, "Description is too long")
    .optional()
    .or(z.literal(""))
    .transform((val) => (val === "" ? null : val)),
  isActive: z.boolean().default(true),
  sortOrder: z.number().int().default(0),
});

export async function getServices() {
  const session = await auth();
  if (!session?.user?.id) {
    return [];
  }

  return await prisma.service.findMany({
    where: { userId: session.user.id },
    orderBy: {
      sortOrder: "asc",
    },
  });
}

export async function getActiveServices() {
  const session = await auth();
  if (!session?.user?.id) {
    return [];
  }

  return await prisma.service.findMany({
    where: {
      userId: session.user.id,
      isActive: true,
    },
    orderBy: {
      sortOrder: "asc",
    },
  });
}

export async function createService(formData: FormData) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      throw new Error("Unauthorized");
    }
    const userId = session.user.id;

    const priceValue = formData.get("price");
    const rawData = {
      name: formData.get("name"),
      duration: formData.get("duration") ? Number(formData.get("duration")) : 60,
      price: priceValue && priceValue !== "" ? Number(priceValue) : null,
      description: formData.get("description") || "",
      isActive: formData.get("isActive") === "true",
      sortOrder: formData.get("sortOrder") ? Number(formData.get("sortOrder")) : 0,
    };

    const validated = serviceSchema.parse(rawData);

    // Check for duplicate service name within user's services
    const existing = await prisma.service.findFirst({
      where: {
        userId,
        name: validated.name,
      },
    });

    if (existing) {
      throw new Error("A service with this name already exists");
    }

    await prisma.service.create({
      data: {
        name: validated.name,
        duration: validated.duration,
        price: validated.price,
        description: validated.description,
        isActive: validated.isActive,
        sortOrder: validated.sortOrder,
        userId,
      },
    });

    revalidatePath("/settings");
    return { success: true };
  } catch (error) {
    if (error instanceof z.ZodError) {
      throw new Error(error.issues[0].message);
    }
    throw error;
  }
}

export async function updateService(id: string, formData: FormData) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      throw new Error("Unauthorized");
    }
    const userId = session.user.id;

    // Verify service belongs to user
    const existingService = await prisma.service.findFirst({
      where: { id, userId },
    });

    if (!existingService) {
      throw new Error("Service not found");
    }

    const priceValue = formData.get("price");
    const rawData = {
      name: formData.get("name"),
      duration: formData.get("duration") ? Number(formData.get("duration")) : 60,
      price: priceValue && priceValue !== "" ? Number(priceValue) : null,
      description: formData.get("description") || "",
      isActive: formData.get("isActive") === "true",
      sortOrder: formData.get("sortOrder") ? Number(formData.get("sortOrder")) : 0,
    };

    const validated = serviceSchema.parse(rawData);

    // Check for duplicate service name (excluding current service, within user's services)
    const existing = await prisma.service.findFirst({
      where: {
        userId,
        AND: [{ id: { not: id } }, { name: validated.name }],
      },
    });

    if (existing) {
      throw new Error("Another service with this name already exists");
    }

    await prisma.service.update({
      where: { id },
      data: {
        name: validated.name,
        duration: validated.duration,
        price: validated.price,
        description: validated.description,
        isActive: validated.isActive,
        sortOrder: validated.sortOrder,
      },
    });

    revalidatePath("/settings");
    return { success: true };
  } catch (error) {
    if (error instanceof z.ZodError) {
      throw new Error(error.issues[0].message);
    }
    throw error;
  }
}

export async function deleteService(id: string) {
  const session = await auth();
  if (!session?.user?.id) {
    throw new Error("Unauthorized");
  }

  // Verify service belongs to user
  const service = await prisma.service.findFirst({
    where: {
      id,
      userId: session.user.id,
    },
  });

  if (!service) {
    throw new Error("Service not found");
  }

  await prisma.service.delete({
    where: { id },
  });

  revalidatePath("/settings");
  return { success: true };
}

export async function toggleServiceActive(id: string) {
  const session = await auth();
  if (!session?.user?.id) {
    throw new Error("Unauthorized");
  }

  // Verify service belongs to user
  const service = await prisma.service.findFirst({
    where: {
      id,
      userId: session.user.id,
    },
  });

  if (!service) {
    throw new Error("Service not found");
  }

  await prisma.service.update({
    where: { id },
    data: {
      isActive: !service.isActive,
    },
  });

  revalidatePath("/settings");
  return { success: true };
}
