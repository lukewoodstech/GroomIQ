"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { z } from "zod";

// Validation schemas
const appointmentSchema = z.object({
  petId: z.string().min(1, "Pet is required"),
  date: z.string().min(1, "Date is required"),
  time: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, "Invalid time format"),
  duration: z.number().min(15, "Duration must be at least 15 minutes").max(480, "Duration cannot exceed 8 hours"),
  service: z.string().nullable(),
  notes: z.string().nullable(),
});

const updateAppointmentSchema = appointmentSchema.extend({
  status: z.enum(["scheduled", "completed", "cancelled"]),
});

const statusSchema = z.enum(["scheduled", "completed", "cancelled"]);

// Helper function to check for conflicts
async function checkAppointmentConflict(
  dateTime: Date,
  duration: number,
  excludeId?: string
): Promise<{ hasConflict: boolean; conflictingAppointment?: any }> {
  const endTime = new Date(dateTime.getTime() + duration * 60000);

  const conflicts = await prisma.appointment.findMany({
    where: {
      AND: [
        { id: excludeId ? { not: excludeId } : undefined },
        { status: "scheduled" },
        {
          OR: [
            // New appointment starts during existing appointment
            {
              AND: [
                { date: { lte: dateTime } },
                {
                  date: {
                    gt: new Date(dateTime.getTime() - 24 * 60 * 60 * 1000), // Within 24 hours for performance
                  },
                },
              ],
            },
          ],
        },
      ],
    },
    include: {
      pet: {
        include: {
          client: true,
        },
      },
    },
  });

  // Check for actual time overlap
  const conflicting = conflicts.find((apt) => {
    const aptEnd = new Date(apt.date.getTime() + apt.duration * 60000);
    const aptStart = apt.date;

    // Check if times overlap
    return (
      (dateTime >= aptStart && dateTime < aptEnd) || // New starts during existing
      (endTime > aptStart && endTime <= aptEnd) || // New ends during existing
      (dateTime <= aptStart && endTime >= aptEnd) // New encompasses existing
    );
  });

  return {
    hasConflict: !!conflicting,
    conflictingAppointment: conflicting,
  };
}

export async function createAppointment(formData: FormData) {
  try {
    // Parse and validate input
    const rawData = {
      petId: formData.get("petId"),
      date: formData.get("date"),
      time: formData.get("time"),
      duration: formData.get("duration") ? Number(formData.get("duration")) : 60,
      service: formData.get("service") || null,
      notes: formData.get("notes") || null,
    };

    const validated = appointmentSchema.parse(rawData);

    // Combine date and time into a DateTime
    const dateTime = new Date(`${validated.date}T${validated.time}`);

    // Validate date is not in the past
    if (dateTime < new Date()) {
      throw new Error("Cannot create appointments in the past");
    }

    // Check for conflicts
    const { hasConflict, conflictingAppointment } = await checkAppointmentConflict(
      dateTime,
      validated.duration
    );

    if (hasConflict) {
      const conflictTime = new Date(conflictingAppointment.date).toLocaleTimeString("en-US", {
        hour: "numeric",
        minute: "2-digit",
      });
      throw new Error(
        `Time slot conflict with ${conflictingAppointment.pet.name} at ${conflictTime}`
      );
    }

    // Verify pet exists
    const pet = await prisma.pet.findUnique({
      where: { id: validated.petId },
    });

    if (!pet) {
      throw new Error("Pet not found");
    }

    await prisma.appointment.create({
      data: {
        petId: validated.petId,
        date: dateTime,
        duration: validated.duration,
        service: validated.service,
        notes: validated.notes,
      },
    });

    revalidatePath("/", "layout");
    return { success: true };
  } catch (error) {
    if (error instanceof z.ZodError) {
      throw new Error(error.issues[0].message);
    }
    throw error;
  }
}

export async function getAppointments() {
  return await prisma.appointment.findMany({
    orderBy: {
      date: "asc",
    },
    include: {
      pet: {
        include: {
          client: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              phone: true,
              email: true,
            },
          },
        },
      },
    },
  });
}

export async function getPets() {
  return await prisma.pet.findMany({
    orderBy: {
      name: "asc",
    },
    include: {
      client: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
          phone: true,
          email: true,
        },
      },
    },
  });
}

export async function updateAppointment(id: string, formData: FormData) {
  try {
    // Parse and validate input
    const rawData = {
      petId: formData.get("petId"),
      date: formData.get("date"),
      time: formData.get("time"),
      duration: formData.get("duration") ? Number(formData.get("duration")) : 60,
      service: formData.get("service") || null,
      notes: formData.get("notes") || null,
      status: formData.get("status") || "scheduled",
    };

    const validated = updateAppointmentSchema.parse(rawData);

    // Combine date and time into a DateTime
    const dateTime = new Date(`${validated.date}T${validated.time}`);

    // Check for conflicts (excluding this appointment)
    const { hasConflict, conflictingAppointment } = await checkAppointmentConflict(
      dateTime,
      validated.duration,
      id
    );

    if (hasConflict) {
      const conflictTime = new Date(conflictingAppointment.date).toLocaleTimeString("en-US", {
        hour: "numeric",
        minute: "2-digit",
      });
      throw new Error(
        `Time slot conflict with ${conflictingAppointment.pet.name} at ${conflictTime}`
      );
    }

    await prisma.appointment.update({
      where: { id },
      data: {
        petId: validated.petId,
        date: dateTime,
        duration: validated.duration,
        service: validated.service,
        notes: validated.notes,
        status: validated.status,
      },
    });

    revalidatePath("/", "layout");
    return { success: true };
  } catch (error) {
    if (error instanceof z.ZodError) {
      throw new Error(error.issues[0].message);
    }
    throw error;
  }
}

export async function updateAppointmentStatus(id: string, status: string) {
  try {
    const validated = statusSchema.parse(status);

    await prisma.appointment.update({
      where: { id },
      data: { status: validated },
    });

    revalidatePath("/", "layout");
    return { success: true };
  } catch (error) {
    if (error instanceof z.ZodError) {
      throw new Error("Invalid status");
    }
    throw error;
  }
}

export async function deleteAppointment(id: string) {
  await prisma.appointment.delete({
    where: { id },
  });

  revalidatePath("/", "layout");
}
