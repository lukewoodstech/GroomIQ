"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { z } from "zod";

// Validation schema
const clientSchema = z.object({
  firstName: z.string().min(1, "First name is required").max(100, "First name is too long"),
  lastName: z.string().min(1, "Last name is required").max(100, "Last name is too long"),
  email: z
    .string()
    .email("Invalid email format")
    .optional()
    .or(z.literal(""))
    .transform((val) => (val === "" ? null : val)),
  phone: z
    .string()
    .regex(/^[\d\s\-\(\)\+]*$/, "Invalid phone number format")
    .optional()
    .or(z.literal(""))
    .transform((val) => (val === "" ? null : val)),
});

export async function createClient(formData: FormData) {
  try {
    const rawData = {
      firstName: formData.get("firstName"),
      lastName: formData.get("lastName"),
      email: formData.get("email") || "",
      phone: formData.get("phone") || "",
    };

    const validated = clientSchema.parse(rawData);

    // Check for potential duplicates
    if (validated.email || validated.phone) {
      const existing = await prisma.client.findFirst({
        where: {
          OR: [
            validated.email ? { email: validated.email } : {},
            validated.phone ? { phone: validated.phone } : {},
          ].filter((condition) => Object.keys(condition).length > 0),
        },
      });

      if (existing) {
        if (existing.email === validated.email && validated.email) {
          throw new Error("A client with this email already exists");
        }
        if (existing.phone === validated.phone && validated.phone) {
          throw new Error("A client with this phone number already exists");
        }
      }
    }

    await prisma.client.create({
      data: {
        firstName: validated.firstName,
        lastName: validated.lastName,
        email: validated.email,
        phone: validated.phone,
      },
    });

    revalidatePath("/clients", "layout");
    return { success: true };
  } catch (error) {
    if (error instanceof z.ZodError) {
      throw new Error(error.issues[0].message);
    }
    throw error;
  }
}

export async function getClients(page: number = 1, itemsPerPage: number = 20) {
  const skip = (page - 1) * itemsPerPage;

  const [clients, total] = await Promise.all([
    prisma.client.findMany({
      skip,
      take: itemsPerPage,
      orderBy: {
        createdAt: "desc",
      },
      include: {
        pets: true,
      },
    }),
    prisma.client.count(),
  ]);

  return {
    clients,
    total,
    page,
    itemsPerPage,
    totalPages: Math.ceil(total / itemsPerPage),
  };
}

export async function getClient(id: string) {
  return await prisma.client.findUnique({
    where: { id },
    include: {
      pets: {
        include: {
          appointments: {
            orderBy: {
              date: "desc",
            },
          },
        },
      },
    },
  });
}

export async function updateClient(id: string, formData: FormData) {
  try {
    const rawData = {
      firstName: formData.get("firstName"),
      lastName: formData.get("lastName"),
      email: formData.get("email") || "",
      phone: formData.get("phone") || "",
    };

    const validated = clientSchema.parse(rawData);

    // Check for potential duplicates (excluding current client)
    if (validated.email || validated.phone) {
      const existing = await prisma.client.findFirst({
        where: {
          AND: [
            { id: { not: id } },
            {
              OR: [
                validated.email ? { email: validated.email } : {},
                validated.phone ? { phone: validated.phone } : {},
              ].filter((condition) => Object.keys(condition).length > 0),
            },
          ],
        },
      });

      if (existing) {
        if (existing.email === validated.email && validated.email) {
          throw new Error("Another client with this email already exists");
        }
        if (existing.phone === validated.phone && validated.phone) {
          throw new Error("Another client with this phone number already exists");
        }
      }
    }

    await prisma.client.update({
      where: { id },
      data: {
        firstName: validated.firstName,
        lastName: validated.lastName,
        email: validated.email,
        phone: validated.phone,
      },
    });

    revalidatePath("/clients", "layout");
    return { success: true };
  } catch (error) {
    if (error instanceof z.ZodError) {
      throw new Error(error.issues[0].message);
    }
    throw error;
  }
}

export async function deleteClient(id: string) {
  // Check if client has appointments
  const client = await prisma.client.findUnique({
    where: { id },
    include: {
      pets: {
        include: {
          _count: {
            select: { appointments: true },
          },
        },
      },
    },
  });

  if (!client) {
    throw new Error("Client not found");
  }

  const totalAppointments = client.pets.reduce(
    (sum, pet) => sum + pet._count.appointments,
    0
  );

  await prisma.client.delete({
    where: { id },
  });

  revalidatePath("/clients", "layout");
  return {
    success: true,
    message:
      totalAppointments > 0
        ? `Deleted client and ${totalAppointments} associated appointment(s)`
        : undefined,
  };
}
