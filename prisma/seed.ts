import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("Seeding database...");

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
      where: { name: service.name },
    });
    if (!existing) {
      await prisma.service.create({
        data: service,
      });
    }
  }

  console.log("✓ Seeded 5 default services");

  // Ensure default settings exist
  await prisma.settings.upsert({
    where: { id: "default" },
    update: {},
    create: { id: "default" },
  });

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
