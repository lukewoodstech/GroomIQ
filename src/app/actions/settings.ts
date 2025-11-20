"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

export async function getSettings() {
  // Get or create default settings
  let settings = await prisma.settings.findUnique({
    where: { id: "default" },
  });

  if (!settings) {
    settings = await prisma.settings.create({
      data: { id: "default" },
    });
  }

  return settings;
}

export async function updateSettings(formData: FormData) {
  const businessName = formData.get("businessName") as string;
  const businessEmail = formData.get("businessEmail") as string;
  const businessPhone = formData.get("businessPhone") as string;
  const defaultDuration = parseInt(formData.get("defaultDuration") as string) || 60;

  await prisma.settings.upsert({
    where: { id: "default" },
    update: {
      businessName,
      businessEmail,
      businessPhone,
      defaultDuration,
    },
    create: {
      id: "default",
      businessName,
      businessEmail,
      businessPhone,
      defaultDuration,
    },
  });

  revalidatePath("/settings");
}
