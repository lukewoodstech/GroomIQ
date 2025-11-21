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
      name: "Demo Groomer",
      password: hashedPassword,
    },
  });

  console.log("✓ Created demo user (demo@groomiq.com / demo1234)");

  // Seed default services with prices
  const services = [
    { name: "Full Groom", duration: 120, price: 75, description: "Complete grooming package including bath, haircut, nail trim, and ear cleaning", sortOrder: 1 },
    { name: "Bath & Brush", duration: 90, price: 50, description: "Relaxing bath with premium shampoo and thorough brushing", sortOrder: 2 },
    { name: "Nail Trim", duration: 30, price: 15, description: "Professional nail trimming and filing", sortOrder: 3 },
    { name: "Teeth Cleaning", duration: 45, price: 30, description: "Dental hygiene service to keep teeth healthy", sortOrder: 4 },
    { name: "De-Shedding Treatment", duration: 60, price: 40, description: "Special treatment to reduce shedding", sortOrder: 5 },
    { name: "Ear Cleaning", duration: 20, price: 12, description: "Gentle ear cleaning and inspection", sortOrder: 6 },
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

  console.log("✓ Seeded 6 services with pricing");

  // Ensure default settings exist with business info
  const existingSettings = await prisma.settings.findUnique({
    where: { userId: demoUser.id },
  });

  if (!existingSettings) {
    await prisma.settings.create({
      data: {
        userId: demoUser.id,
        businessName: "Paws & Claws Grooming",
        businessEmail: "info@pawsandclaws.com",
        businessPhone: "(555) 123-4567",
        defaultDuration: 60,
        openTime: "09:00",
        closeTime: "18:00",
        daysOpen: "1,2,3,4,5,6", // Mon-Sat
      },
    });
  }

  console.log("✓ Created business settings");

  // Create sample clients
  const clients = [
    { firstName: "Sarah", lastName: "Johnson", email: "sarah.j@email.com", phone: "(555) 234-5678" },
    { firstName: "Michael", lastName: "Chen", email: "mchen@email.com", phone: "(555) 345-6789" },
    { firstName: "Emily", lastName: "Rodriguez", email: "emily.r@email.com", phone: "(555) 456-7890" },
    { firstName: "David", lastName: "Thompson", email: "dthompson@email.com", phone: "(555) 567-8901" },
    { firstName: "Jessica", lastName: "Martinez", email: "jmartinez@email.com", phone: "(555) 678-9012" },
    { firstName: "Robert", lastName: "Anderson", email: "randerson@email.com", phone: "(555) 789-0123" },
    { firstName: "Amanda", lastName: "Taylor", email: "ataylor@email.com", phone: "(555) 890-1234" },
  ];

  const createdClients = [];
  for (const client of clients) {
    const existing = await prisma.client.findFirst({
      where: { email: client.email, userId: demoUser.id },
    });
    if (!existing) {
      const created = await prisma.client.create({
        data: {
          ...client,
          userId: demoUser.id,
        },
      });
      createdClients.push(created);
    } else {
      createdClients.push(existing);
    }
  }

  console.log("✓ Created 7 demo clients");

  // Create sample pets
  const pets = [
    { name: "Max", breed: "Golden Retriever", species: "dog", age: 3, notes: "Very friendly, loves treats", clientIndex: 0 },
    { name: "Luna", breed: "Labrador", species: "dog", age: 2, notes: "Energetic, needs extra brushing", clientIndex: 0 },
    { name: "Bella", breed: "Persian", species: "cat", age: 5, notes: "Calm and gentle, long fur requires special care", clientIndex: 1 },
    { name: "Charlie", breed: "Poodle", species: "dog", age: 4, notes: "Regular customer, needs haircut monthly", clientIndex: 2 },
    { name: "Cooper", breed: "Beagle", species: "dog", age: 6, notes: "Sensitive ears, use gentle cleanser", clientIndex: 3 },
    { name: "Daisy", breed: "Siamese", species: "cat", age: 3, notes: "Skittish, handle with care", clientIndex: 4 },
    { name: "Rocky", breed: "German Shepherd", species: "dog", age: 5, notes: "Large breed, double coat", clientIndex: 5 },
    { name: "Molly", breed: "Shih Tzu", species: "dog", age: 2, notes: "Show dog, premium grooming required", clientIndex: 6 },
    { name: "Oliver", breed: "Maine Coon", species: "cat", age: 4, notes: "Extra large cat, very fluffy", clientIndex: 1 },
  ];

  const createdPets = [];
  for (const pet of pets) {
    const { clientIndex, ...petData } = pet;
    const existing = await prisma.pet.findFirst({
      where: {
        name: petData.name,
        clientId: createdClients[clientIndex].id,
        userId: demoUser.id
      },
    });
    if (!existing) {
      const created = await prisma.pet.create({
        data: {
          ...petData,
          clientId: createdClients[clientIndex].id,
          userId: demoUser.id,
        },
      });
      createdPets.push(created);
    } else {
      createdPets.push(existing);
    }
  }

  console.log("✓ Created 9 demo pets");

  // Create sample appointments (past, present, and future)
  const now = new Date();
  const appointments = [
    // Past appointments (completed)
    { petIndex: 0, daysOffset: -7, hour: 10, duration: 120, service: "Full Groom", status: "completed", notes: "Did excellent! Very well-behaved" },
    { petIndex: 2, daysOffset: -5, hour: 14, duration: 90, service: "Bath & Brush", status: "completed", notes: "Extra matting removed" },
    { petIndex: 4, daysOffset: -3, hour: 11, duration: 60, service: "De-Shedding Treatment", status: "completed", notes: "Shedding reduced significantly" },

    // Recent appointments
    { petIndex: 6, daysOffset: -1, hour: 9, duration: 120, service: "Full Groom", status: "completed", notes: "Great session" },

    // Today's appointments
    { petIndex: 1, daysOffset: 0, hour: 10, duration: 90, service: "Bath & Brush", status: "scheduled", notes: "Regular monthly appointment" },
    { petIndex: 7, daysOffset: 0, hour: 13, duration: 120, service: "Full Groom", status: "scheduled", notes: "Show prep - needs perfect cut" },

    // Upcoming appointments
    { petIndex: 3, daysOffset: 2, hour: 10, duration: 120, service: "Full Groom", status: "scheduled", notes: "Monthly haircut" },
    { petIndex: 5, daysOffset: 3, hour: 15, duration: 45, service: "Teeth Cleaning", status: "scheduled", notes: "First time teeth cleaning" },
    { petIndex: 8, daysOffset: 5, hour: 11, duration: 90, service: "Bath & Brush", status: "scheduled", notes: "Needs de-matting" },
    { petIndex: 0, daysOffset: 7, hour: 14, duration: 30, service: "Nail Trim", status: "scheduled", notes: "Quick nail trim only" },
    { petIndex: 2, daysOffset: 10, hour: 10, duration: 90, service: "Bath & Brush", status: "scheduled", notes: "Regular grooming" },
    { petIndex: 4, daysOffset: 14, hour: 11, duration: 20, service: "Ear Cleaning", status: "scheduled", notes: "Preventive care" },
  ];

  for (const appt of appointments) {
    const { petIndex, daysOffset, hour, ...apptData } = appt;
    const apptDate = new Date(now);
    apptDate.setDate(apptDate.getDate() + daysOffset);
    apptDate.setHours(hour, 0, 0, 0);

    const existing = await prisma.appointment.findFirst({
      where: {
        petId: createdPets[petIndex].id,
        date: apptDate,
        userId: demoUser.id,
      },
    });

    if (!existing) {
      await prisma.appointment.create({
        data: {
          ...apptData,
          date: apptDate,
          petId: createdPets[petIndex].id,
          userId: demoUser.id,
        },
      });
    }
  }

  console.log("✓ Created 12 demo appointments (past, present, and future)");

  console.log("\n🎉 Database seeded successfully!");
  console.log("\nLogin credentials:");
  console.log("  Email: demo@groomiq.com");
  console.log("  Password: demo1234");
  console.log("\nDemo data includes:");
  console.log("  - 7 clients");
  console.log("  - 9 pets (mix of dogs and cats)");
  console.log("  - 12 appointments (showing past, today, and future)");
  console.log("  - 6 services with pricing");
  console.log("  - Complete business settings");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
