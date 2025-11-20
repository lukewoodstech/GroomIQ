"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { z } from "zod";

// Validation schema
const settingsSchema = z.object({
  businessName: z.string().max(200, "Business name is too long"),
  businessEmail: z
    .string()
    .email("Invalid email format")
    .optional()
    .or(z.literal(""))
    .transform((val) => (val === "" ? "" : val)),
  businessPhone: z
    .string()
    .regex(/^[\d\s\-\(\)\+]*$/, "Invalid phone number format")
    .optional()
    .or(z.literal(""))
    .transform((val) => (val === "" ? "" : val)),
  defaultDuration: z
    .number()
    .int("Duration must be a whole number")
    .min(15, "Duration must be at least 15 minutes")
    .max(480, "Duration cannot exceed 8 hours"),
});

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
  try {
    const durationValue = formData.get("defaultDuration");
    const rawData = {
      businessName: formData.get("businessName") || "",
      businessEmail: formData.get("businessEmail") || "",
      businessPhone: formData.get("businessPhone") || "",
      defaultDuration: durationValue ? Number(durationValue) : 60,
    };

    const validated = settingsSchema.parse(rawData);

    await prisma.settings.upsert({
      where: { id: "default" },
      update: {
        businessName: validated.businessName,
        businessEmail: validated.businessEmail,
        businessPhone: validated.businessPhone,
        defaultDuration: validated.defaultDuration,
      },
      create: {
        id: "default",
        businessName: validated.businessName,
        businessEmail: validated.businessEmail,
        businessPhone: validated.businessPhone,
        defaultDuration: validated.defaultDuration,
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
