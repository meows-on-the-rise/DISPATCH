import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  await prisma.user.upsert({
    where: { email: "admin@dispatch.app" },
    update: {},
    create: {
      userId: "admin001", fullName: "Dispatch Admin", username: "dispatch_admin",
      email: "admin@dispatch.app", phone: "+26622000000",
      password: await bcrypt.hash("Admin@1234", 12),
      dob: new Date("1990-01-01"), idNumber: "ADMIN0001", role: "ADMIN",
      wallet: { create: { balance: 0 } },
    },
  });
  await prisma.user.upsert({
    where: { email: "passenger@dispatch.app" },
    update: {},
    create: {
      userId: "pass0001", fullName: "Test Passenger", username: "test_passenger",
      email: "passenger@dispatch.app", phone: "+26657000001",
      password: await bcrypt.hash("Pass@1234", 12),
      dob: new Date("2000-01-01"), idNumber: "P00000001", role: "PASSENGER",
      wallet: { create: { balance: 500 } },
    },
  });
  await prisma.user.upsert({
    where: { email: "driver@dispatch.app" },
    update: {},
    create: {
      userId: "driv0001", fullName: "Test Driver", username: "test_driver",
      email: "driver@dispatch.app", phone: "+26658000001",
      password: await bcrypt.hash("Pass@1234", 12),
      dob: new Date("1995-01-01"), idNumber: "D00000001", role: "DRIVER",
      wallet: { create: { balance: 0 } },
      driverProfile: {
        create: {
          vehicleMake: "Toyota", vehicleModel: "Corolla",
          vehiclePlate: "A 0001 LS", vehicleColor: "White",
          isVerified: true, isClockedIn: false,
        },
      },
    },
  });
  console.log("✅ Seed complete");
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
