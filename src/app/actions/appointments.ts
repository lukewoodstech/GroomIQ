"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

export async function createAppointment(formData: FormData) {
  const petId = formData.get("petId") as string;
  const date = formData.get("date") as string;
  const time = formData.get("time") as string;
  const duration = formData.get("duration")
    ? parseInt(formData.get("duration") as string)
    : 60;
  const service = formData.get("service") as string | null;
  const notes = formData.get("notes") as string | null;

  if (!petId || !date || !time) {
    throw new Error("Pet, date, and time are required");
  }

  // Combine date and time into a DateTime
  const dateTime = new Date(`${date}T${time}`);

  await prisma.appointment.create({
    data: {
      petId,
      date: dateTime,
      duration,
      service: service || null,
      notes: notes || null,
    },
  });

  revalidatePath("/schedule");
  revalidatePath("/");
}

export async function getAppointments() {
  return await prisma.appointment.findMany({
    orderBy: {
      date: "asc",
    },
    include: {
      pet: {
        include: {
          client: true,
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
      client: true,
    },
  });
}

export async function updateAppointment(id: string, formData: FormData) {
  const petId = formData.get("petId") as string;
  const date = formData.get("date") as string;
  const time = formData.get("time") as string;
  const duration = formData.get("duration")
    ? parseInt(formData.get("duration") as string)
    : 60;
  const service = formData.get("service") as string | null;
  const notes = formData.get("notes") as string | null;
  const status = formData.get("status") as string;

  if (!petId || !date || !time) {
    throw new Error("Pet, date, and time are required");
  }

  // Combine date and time into a DateTime
  const dateTime = new Date(`${date}T${time}`);

  await prisma.appointment.update({
    where: { id },
    data: {
      petId,
      date: dateTime,
      duration,
      service: service || null,
      notes: notes || null,
      status: status || "scheduled",
    },
  });

  revalidatePath("/schedule");
  revalidatePath("/");
}

export async function updateAppointmentStatus(id: string, status: string) {
  await prisma.appointment.update({
    where: { id },
    data: { status },
  });

  revalidatePath("/schedule");
  revalidatePath("/");
}

export async function deleteAppointment(id: string) {
  await prisma.appointment.delete({
    where: { id },
  });

  revalidatePath("/schedule");
  revalidatePath("/");
}

