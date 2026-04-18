import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Seeding database...");

  const hash = async (pw: string) => bcrypt.hash(pw, 12);

  // ── Admin ────────────────────────────────────────────────────────────────
  const admin = await prisma.user.upsert({
    where: { email: "admin@dispatch.app" },
    update: {},
    create: {
      userId: "admin001",
      fullName: "Dispatch Admin",
      username: "dispatch_admin",
      email: "admin@dispatch.app",
      phone: "+26622000000",
      password: await hash("Admin@1234"),
      dob: new Date("1990-01-01"),
      idNumber: "ADMIN0001",
      role: "ADMIN",
      wallet: { create: { balance: 0 } },
    },
  });

  // ── Passenger ────────────────────────────────────────────────────────────
  const passenger = await prisma.user.upsert({
    where: { email: "passenger@dispatch.app" },
    update: {},
    create: {
      userId: "p202612345",
      fullName: "Thabo Mokoena",
      username: "thabo_m",
      email: "passenger@dispatch.app",
      phone: "+26657123456",
      password: await hash("Pass@1234"),
      dob: new Date("1998-05-15"),
      idNumber: "P0012345678",
      role: "PASSENGER",
      wallet: { create: { balance: 250.00 } },
    },
  });

  // ── Driver ───────────────────────────────────────────────────────────────
  const driver = await prisma.user.upsert({
    where: { email: "driver@dispatch.app" },
    update: {},
    create: {
      userId: "d202654321",
      fullName: "Rethabile Nkosi",
      username: "rethabile_n",
      email: "driver@dispatch.app",
      phone: "+26658654321",
      password: await hash("Pass@1234"),
      dob: new Date("1993-08-22"),
      idNumber: "D0087654321",
      role: "DRIVER",
      rating: 4.8,
      reviewCount: 23,
      wallet: { create: { balance: 380.50 } },
      driverProfile: {
        create: {
          vehicleMake: "Toyota",
          vehicleModel: "Corolla",
          vehiclePlate: "A 1234 LS",
          vehicleColor: "White",
          isVerified: true,
          isClockedIn: false,
        },
      },
    },
  });

  // Add verified documents to driver
  const driverProfile = await prisma.driverProfile.findUnique({
    where: { userId: driver.id },
  });

  if (driverProfile) {
    for (const docType of ["LICENSE", "PERMIT", "REGISTRATION"]) {
      await prisma.driverDocument.upsert({
        where: {
          driverProfileId_docType: {
            driverProfileId: driverProfile.id,
            docType,
          },
        },
        update: {},
        create: {
          driverProfileId: driverProfile.id,
          docType,
          fileUrl: `https://res.cloudinary.com/demo/image/upload/sample.jpg`,
          status: "VERIFIED",
          reviewedAt: new Date(),
        },
      });
    }
  }

  // ── Sample completed trip ────────────────────────────────────────────────
  const existingTrip = await prisma.trip.findFirst({
    where: { passengerId: passenger.id, status: "COMPLETED" },
  });

  if (!existingTrip) {
    const trip = await prisma.trip.create({
      data: {
        passengerId: passenger.id,
        driverId: driver.id,
        status: "COMPLETED",
        pickupAddress: "NUL Main Gate, Roma",
        pickupLat: -29.4472,
        pickupLng: 27.6714,
        dropoffAddress: "Maseru Mall",
        dropoffLat: -29.3167,
        dropoffLng: 27.4833,
        seats: 1,
        distanceKm: 22.4,
        durationMin: 35,
        totalPrice: 218.60,
        driverEarning: 174.88,
        systemCommission: 43.72,
        startedAt: new Date(Date.now() - 2 * 60 * 60 * 1000),
        completedAt: new Date(Date.now() - 90 * 60 * 1000),
      },
    });

    // Ratings for that trip
    await prisma.rating.createMany({
      data: [
        {
          tripId: trip.id,
          giverId: passenger.id,
          receiverId: driver.id,
          score: 5,
          review: "Excellent driver, very punctual!",
        },
        {
          tripId: trip.id,
          giverId: driver.id,
          receiverId: passenger.id,
          score: 5,
          review: "Great passenger, ready on time.",
        },
      ],
      skipDuplicates: true,
    });
  }

  console.log("✅ Seed complete!");
  console.log("─────────────────────────────────────────");
  console.log("Admin     →  admin@dispatch.app   / Admin@1234");
  console.log("Passenger →  passenger@dispatch.app / Pass@1234");
  console.log("Driver    →  driver@dispatch.app    / Pass@1234");
  console.log("─────────────────────────────────────────");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
