import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log("Seeding database...");

  // Create default demo user
  const hashedPassword = await bcrypt.hash("demo1234", 10);
  const demoUser = await prisma.user.upsert({
    where: { email: "demo@groomiq.com" },
    update: {},
    create: {
      email: "demo@groomiq.com",
      name: "Demo User",
      password: hashedPassword,
    },
  });

  console.log("✓ Created demo user (demo@groomiq.com / demo1234)");

  // Seed default services
  const services = [
    { name: "Full Groom", duration: 120, sortOrder: 1 },
    { name: "Bath & Brush", duration: 90, sortOrder: 2 },
    { name: "Nail Trim", duration: 30, sortOrder: 3 },
    { name: "Teeth Cleaning", duration: 45, sortOrder: 4 },
    { name: "De-Shedding Treatment", duration: 60, sortOrder: 5 },
  ];

  for (const service of services) {
    const existing = await prisma.service.findFirst({
      where: { name: service.name, userId: demoUser.id },
    });
    if (!existing) {
      await prisma.service.create({
        data: {
          ...service,
          userId: demoUser.id,
        },
      });
    }
  }

  console.log("✓ Seeded 5 default services");

  // Ensure default settings exist
  const existingSettings = await prisma.settings.findUnique({
    where: { userId: demoUser.id },
  });

  if (!existingSettings) {
    await prisma.settings.create({
      data: {
        userId: demoUser.id,
      },
    });
  }

  console.log("✓ Ensured default settings exist");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
