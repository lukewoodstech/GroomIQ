import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { z } from "zod";

const signupSchema = z.object({
  name: z.string().min(1, "Name is required").max(100, "Name is too long"),
  email: z.string().email("Invalid email format"),
  password: z.string().min(8, "Password must be at least 8 characters"),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validated = signupSchema.parse(body);

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email: validated.email },
    });

    if (existingUser) {
      return NextResponse.json(
        { error: "A user with this email already exists" },
        { status: 400 }
      );
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(validated.password, 10);

    // Create user
    const user = await prisma.user.create({
      data: {
        name: validated.name,
        email: validated.email,
        password: hashedPassword,
      },
    });

    // Create default settings for the user
    await prisma.settings.create({
      data: {
        userId: user.id,
      },
    });

    // Create default services for the user
    const defaultServices = [
      { name: "Bath & Brush", duration: 60, price: 45, description: "Basic bath and brush out", sortOrder: 1 },
      { name: "Full Groom", duration: 120, price: 85, description: "Complete grooming service including bath, haircut, and styling", sortOrder: 2 },
      { name: "Haircut", duration: 90, price: 65, description: "Breed-specific haircut and styling", sortOrder: 3 },
      { name: "Nail Trim", duration: 15, price: 15, description: "Nail trimming and filing", sortOrder: 4 },
      { name: "Ear Cleaning", duration: 10, price: 10, description: "Ear cleaning and plucking", sortOrder: 5 },
      { name: "De-shedding Treatment", duration: 45, price: 40, description: "Special treatment to reduce shedding", sortOrder: 6 },
    ];

    await prisma.service.createMany({
      data: defaultServices.map(service => ({
        ...service,
        userId: user.id,
        isActive: true,
      })),
    });

    return NextResponse.json(
      { message: "User created successfully", userId: user.id },
      { status: 201 }
    );
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: error.issues[0].message },
        { status: 400 }
      );
    }

    console.error("Signup error:", error);
    return NextResponse.json(
      { error: "An error occurred during signup" },
      { status: 500 }
    );
  }
}
