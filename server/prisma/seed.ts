import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import crypto from "crypto";

const prisma = new PrismaClient();
const hash = (pw: string) => bcrypt.hash(pw, 12);

const PLACEHOLDER_DOC =
  "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==";

async function main() {
  console.log("🌱 Seeding database…");

  // ── Admin ──────────────────────────────────────────────────────────────────
  await prisma.user.upsert({
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

  // ── Passengers (7) ────────────────────────────────────────────────────────
  const passengerData = [
    { userId:"p202610001", fullName:"Thabo Mokoena",     username:"thabo_m",       email:"thabo@dispatch.app",      phone:"+26657100001", dob:"1998-05-15", idNumber:"P0010000001", balance:350.00, rating:4.7 },
    { userId:"p202610002", fullName:"Lineo Sefali",      username:"lineo_s",       email:"lineo@dispatch.app",      phone:"+26657100002", dob:"2000-03-22", idNumber:"P0010000002", balance:120.50, rating:4.9 },
    { userId:"p202610003", fullName:"Mpho Ramakatsa",    username:"mpho_r",        email:"mpho@dispatch.app",       phone:"+26657100003", dob:"1995-11-08", idNumber:"P0010000003", balance:0.00,   rating:4.5 },
    { userId:"p202610004", fullName:"Palesa Ntshekhe",   username:"palesa_n",      email:"palesa@dispatch.app",     phone:"+26657100004", dob:"2001-07-14", idNumber:"P0010000004", balance:500.00, rating:5.0 },
    { userId:"p202610005", fullName:"Teboho Lekhotsa",   username:"teboho_lk",     email:"teboho_p@dispatch.app",   phone:"+26657100005", dob:"1993-09-30", idNumber:"P0010000005", balance:75.00,  rating:4.3 },
    { userId:"p202610006", fullName:"Nthabiseng Motsi",  username:"nthabiseng_m",  email:"nthabiseng@dispatch.app", phone:"+26657100006", dob:"1997-02-18", idNumber:"P0010000006", balance:200.00, rating:4.8 },
    { userId:"p202610007", fullName:"Sello Phafoli",     username:"sello_p",       email:"sello@dispatch.app",      phone:"+26657100007", dob:"1999-12-05", idNumber:"P0010000007", balance:640.00, rating:4.6 },
  ];

  const passengers: { id: string; fullName: string }[] = [];
  for (const p of passengerData) {
    const u = await prisma.user.upsert({
      where: { email: p.email },
      update: {},
      create: {
        userId: p.userId, fullName: p.fullName, username: p.username,
        email: p.email, phone: p.phone, password: await hash("Pass@1234"),
        dob: new Date(p.dob), idNumber: p.idNumber, role: "PASSENGER",
        rating: p.rating, wallet: { create: { balance: p.balance } },
      },
    });
    passengers.push({ id: u.id, fullName: u.fullName });
  }

  // ── Drivers (7) ───────────────────────────────────────────────────────────
  const driverData = [
    { userId:"d202620001", fullName:"Rethabile Nkosi",   username:"rethabile_n", email:"rethabile@dispatch.app", phone:"+26658200001", dob:"1993-08-22", idNumber:"D0020000001", balance:380.50, rating:4.8, make:"Toyota",     model:"Corolla", plate:"A 1234 LS", color:"White",  verified:true  },
    { userId:"d202620002", fullName:"Motlatsi Sithole",  username:"motlatsi_s",  email:"motlatsi@dispatch.app",  phone:"+26658200002", dob:"1988-04-10", idNumber:"D0020000002", balance:920.00, rating:4.6, make:"Honda",      model:"Civic",   plate:"B 5678 LS", color:"Black",  verified:true  },
    { userId:"d202620003", fullName:"Tankiso Ramokhele", username:"tankiso_r",   email:"tankiso@dispatch.app",   phone:"+26658200003", dob:"1991-01-30", idNumber:"D0020000003", balance:150.75, rating:4.9, make:"Nissan",     model:"Almera",  plate:"C 9012 LS", color:"Silver", verified:true  },
    { userId:"d202620004", fullName:"Lerato Molapo",     username:"lerato_m",    email:"lerato@dispatch.app",    phone:"+26658200004", dob:"1996-06-15", idNumber:"D0020000004", balance:0.00,   rating:4.2, make:"Hyundai",    model:"i20",     plate:"D 3456 LS", color:"Blue",   verified:false },
    { userId:"d202620005", fullName:"Tsepiso Mafoso",    username:"tsepiso_m",   email:"tsepiso@dispatch.app",   phone:"+26658200005", dob:"1985-10-20", idNumber:"D0020000005", balance:560.00, rating:4.7, make:"Volkswagen", model:"Polo",    plate:"E 7890 LS", color:"Gray",   verified:true  },
    { userId:"d202620006", fullName:"Neo Mahase",        username:"neo_mh",      email:"neo@dispatch.app",       phone:"+26658200006", dob:"1994-03-05", idNumber:"D0020000006", balance:210.30, rating:4.5, make:"Ford",       model:"Figo",    plate:"F 1122 LS", color:"Red",    verified:true  },
    { userId:"d202620007", fullName:"Mamello Sekoati",   username:"mamello_s",   email:"mamello@dispatch.app",   phone:"+26658200007", dob:"1990-07-25", idNumber:"D0020000007", balance:430.00, rating:4.8, make:"Toyota",     model:"Vitz",    plate:"G 3344 LS", color:"White",  verified:true  },
  ];

  const drivers: { id: string; profileId: string; fullName: string }[] = [];
  for (const d of driverData) {
    const u = await prisma.user.upsert({
      where: { email: d.email },
      update: {},
      create: {
        userId: d.userId, fullName: d.fullName, username: d.username,
        email: d.email, phone: d.phone, password: await hash("Pass@1234"),
        dob: new Date(d.dob), idNumber: d.idNumber, role: "DRIVER",
        rating: d.rating, wallet: { create: { balance: d.balance } },
        driverProfile: {
          create: {
            vehicleMake: d.make, vehicleModel: d.model,
            vehiclePlate: d.plate, vehicleColor: d.color,
            isVerified: d.verified, isClockedIn: false,
          },
        },
      },
    });
    const profile = await prisma.driverProfile.findUnique({ where: { userId: u.id } });
    if (profile) {
      // ── DriverDocument: 3 per driver × 7 drivers = 21 rows ────────────────
      for (const docType of ["LICENSE", "PERMIT", "REGISTRATION"]) {
        await prisma.driverDocument.upsert({
          where: { driverProfileId_docType: { driverProfileId: profile.id, docType } },
          update: {},
          create: {
            driverProfileId: profile.id, docType, fileUrl: PLACEHOLDER_DOC,
            status: d.verified ? "VERIFIED" : "PENDING",
            reviewedAt: d.verified ? new Date() : null,
          },
        });
      }
      drivers.push({ id: u.id, profileId: profile.id, fullName: u.fullName });
    }
  }

  // ── Trips (7 completed + 1 cancelled = 8 total, 7 for rating/location) ────
  const locs = [
    { pickup:"NUL Main Gate, Roma",       pLat:-29.4472, pLng:27.6714, dropoff:"Maseru Mall",          dLat:-29.3167, dLng:27.4833 },
    { pickup:"Lancers Inn, Kingsway",      pLat:-29.3145, pLng:27.4765, dropoff:"Pioneer Mall, Maseru", dLat:-29.3090, dLng:27.4710 },
    { pickup:"Shoprite Maseru",            pLat:-29.3200, pLng:27.4820, dropoff:"NUL Main Gate, Roma",  dLat:-29.4472, dLng:27.6714 },
    { pickup:"Maseru Bus Stop",            pLat:-29.3050, pLng:27.4690, dropoff:"Teyateyaneng Market",  dLat:-29.1500, dLng:27.7500 },
    { pickup:"QEII Hospital, Maseru",      pLat:-29.3130, pLng:27.4840, dropoff:"Lesotho Sun Hotel",    dLat:-29.3220, dLng:27.5000 },
    { pickup:"Pioneer Mall, Maseru",       pLat:-29.3090, pLng:27.4710, dropoff:"Maseru Bridge Border", dLat:-29.3300, dLng:27.4600 },
    { pickup:"Maseru Mall",                pLat:-29.3167, pLng:27.4833, dropoff:"Roma Valley",          dLat:-29.4300, dLng:27.6600 },
    { pickup:"Teyateyaneng Market",        pLat:-29.1500, pLng:27.7500, dropoff:"NUL Main Gate, Roma",  dLat:-29.4472, dLng:27.6714 },
  ];

  // 7 completed trips (indices 0-6), 1 cancelled (index 7)
  const tripInputs = [
    { li:0, seats:1, dist:22.4, dur:35, price:248.60, earn:198.88, comm:49.72, status:"COMPLETED", pI:0, dI:0, ago:7 },
    { li:1, seats:2, dist: 3.1, dur: 8, price: 87.30, earn: 69.84, comm:17.46, status:"COMPLETED", pI:1, dI:1, ago:5 },
    { li:2, seats:1, dist:22.4, dur:38, price:252.20, earn:201.76, comm:50.44, status:"COMPLETED", pI:2, dI:2, ago:4 },
    { li:3, seats:3, dist:30.8, dur:45, price:338.50, earn:270.80, comm:67.70, status:"COMPLETED", pI:3, dI:4, ago:3 },
    { li:4, seats:1, dist: 2.5, dur: 6, price: 59.00, earn: 47.20, comm:11.80, status:"COMPLETED", pI:5, dI:5, ago:2 },
    { li:5, seats:2, dist: 5.2, dur:12, price:108.80, earn: 87.04, comm:21.76, status:"COMPLETED", pI:6, dI:6, ago:1 },
    { li:6, seats:1, dist:19.8, dur:30, price:224.70, earn:179.76, comm:44.94, status:"COMPLETED", pI:4, dI:3, ago:1 },
    { li:7, seats:1, dist:30.8, dur:47, price:341.10, earn:272.88, comm:68.22, status:"CANCELLED", pI:0, dI:2, ago:2 },
  ];

  const tripIds: string[] = [];
  for (const t of tripInputs) {
    const loc = locs[t.li];
    const existing = await prisma.trip.findFirst({
      where: { passengerId: passengers[t.pI].id, pickupAddress: loc.pickup, dropoffAddress: loc.dropoff },
    });
    if (existing) { tripIds.push(existing.id); continue; }

    const dMs = t.ago * 86_400_000;
    const trip = await prisma.trip.create({
      data: {
        passengerId: passengers[t.pI].id,
        driverId: t.dI >= 0 ? drivers[t.dI].id : null,
        status: t.status as any,
        pickupAddress: loc.pickup,   pickupLat: loc.pLat,   pickupLng: loc.pLng,
        dropoffAddress: loc.dropoff, dropoffLat: loc.dLat,  dropoffLng: loc.dLng,
        seats: t.seats, distanceKm: t.dist, durationMin: t.dur,
        totalPrice: t.price, driverEarning: t.earn, systemCommission: t.comm,
        startedAt:   t.status === "COMPLETED" ? new Date(Date.now() - dMs - 3_600_000) : null,
        completedAt: t.status === "COMPLETED" ? new Date(Date.now() - dMs)             : null,
        cancelledAt: t.status === "CANCELLED" ? new Date(Date.now() - dMs)             : null,
        cancelReason:t.status === "CANCELLED" ? "Passenger no longer needed the ride"  : null,
        cancelledBy: t.status === "CANCELLED" ? passengers[t.pI].id                   : null,
        createdAt: new Date(Date.now() - dMs - 7_200_000),
      },
    });
    tripIds.push(trip.id);
  }

  // ── WalletTransaction: 7 TRIP_PAYMENT + 7 TRIP_EARNING + 7 DEPOSIT + 7 WITHDRAWAL ──
  // Trip payments & earnings for all 7 completed trips
  for (let ci = 0; ci < 7; ci++) {
    const t = tripInputs[ci];
    const tripId = tripIds[ci];
    const already = await prisma.walletTransaction.findFirst({ where: { tripId } });
    if (already) continue;
    const pWallet = await prisma.wallet.findUnique({ where: { userId: passengers[t.pI].id } });
    const dWallet = await prisma.wallet.findUnique({ where: { userId: drivers[t.dI].id } });
    if (pWallet) {
      await prisma.walletTransaction.create({
        data: { walletId: pWallet.id, type: "TRIP_PAYMENT", amount: t.price,
                description: `Payment: ${locs[t.li].pickup} → ${locs[t.li].dropoff}`, tripId },
      });
    }
    if (dWallet) {
      await prisma.walletTransaction.create({
        data: { walletId: dWallet.id, type: "TRIP_EARNING", amount: t.earn,
                description: `Earning: ${locs[t.li].pickup} → ${locs[t.li].dropoff}`, tripId },
      });
    }
  }

  // 7 deposits — one per passenger
  for (const [pI, amount] of [[0,200],[1,150],[2,100],[3,500],[4,75],[5,300],[6,640]] as [number,number][]) {
    const w = await prisma.wallet.findUnique({ where: { userId: passengers[pI].id } });
    if (w && !(await prisma.walletTransaction.findFirst({ where: { walletId: w.id, type: "DEPOSIT" } }))) {
      await prisma.walletTransaction.create({
        data: { walletId: w.id, type: "DEPOSIT", amount, description: "Dispatch Cash top-up via EcoCash" },
      });
    }
  }

  // 7 withdrawals — one per driver
  for (const [dI, amount] of [[0,100],[1,200],[2,50],[3,0],[4,150],[5,80],[6,120]] as [number,number][]) {
    if (amount === 0) continue; // driver 3 has 0 balance, skip
    const w = await prisma.wallet.findUnique({ where: { userId: drivers[dI].id } });
    if (w && !(await prisma.walletTransaction.findFirst({ where: { walletId: w.id, type: "WITHDRAWAL" } }))) {
      await prisma.walletTransaction.create({
        data: { walletId: w.id, type: "WITHDRAWAL", amount, description: "Withdrawal to EcoCash" },
      });
    }
  }

  // ── Rating: 7 unique passenger→driver + 7 driver→passenger = 14 rows ──────
  // Each uses a different completed trip (indices 0-6)
  const ratingRows = [
    { ti:0, pI:0, dI:0, ps:5, pr:"Excellent driver, very punctual!",         ds:5, dr:"Great passenger, ready on time."      },
    { ti:1, pI:1, dI:1, ps:4, pr:"Good service, comfortable ride.",           ds:5, dr:"Polite and on time."                  },
    { ti:2, pI:2, dI:2, ps:5, pr:"Professional, knew all the shortcuts.",     ds:4, dr:"Good passenger, no complaints."       },
    { ti:3, pI:3, dI:4, ps:5, pr:"Best driver experience so far!",            ds:5, dr:"Lovely passenger, very friendly."     },
    { ti:4, pI:5, dI:5, ps:3, pr:"Average ride, a bit late.",                 ds:4, dr:"Friendly but kept changing pickup."   },
    { ti:5, pI:6, dI:6, ps:5, pr:"Smooth and safe journey.",                  ds:5, dr:"Perfect passenger."                   },
    { ti:6, pI:4, dI:3, ps:4, pr:"Reliable driver, clean car.",               ds:5, dr:"Very respectful, no issues at all."   },
  ];

  for (const r of ratingRows) {
    await prisma.rating.createMany({
      data: [
        { tripId: tripIds[r.ti], giverId: passengers[r.pI].id, receiverId: drivers[r.dI].id,  score: r.ps, review: r.pr },
        { tripId: tripIds[r.ti], giverId: drivers[r.dI].id,   receiverId: passengers[r.pI].id, score: r.ds, review: r.dr },
      ],
      skipDuplicates: true,
    });
  }

  // ── TripLocation: 7 trips × 4 GPS snapshots each = 28 rows ───────────────
  for (let i = 0; i < 7; i++) {
    const tripId = tripIds[i];
    const loc = locs[i];
    if (await prisma.tripLocation.findFirst({ where: { tripId } })) continue;
    await prisma.tripLocation.createMany({
      data: [0, 0.25, 0.5, 0.75, 1].map((f, j) => ({
        tripId,
        recordedAt: new Date(Date.now() - (tripInputs[i].ago * 86_400_000) - 3_600_000 + j * 600_000),
        lat: loc.pLat + (loc.dLat - loc.pLat) * f,
        lng: loc.pLng + (loc.dLng - loc.pLng) * f,
      })),
    });
  }

  // ── OtpToken: 7 rows (one per passenger, already expired/used for safety) ─
  for (let i = 0; i < 7; i++) {
    const existing = await prisma.otpToken.findFirst({ where: { userId: passengers[i].id } });
    if (existing) continue;
    await prisma.otpToken.create({
      data: {
        userId: passengers[i].id,
        token: String(100000 + ((i + 1) * 123456) % 900000), // deterministic 6-digit OTP
        expiresAt: new Date(Date.now() - 86_400_000), // expired yesterday
        used: true,
      },
    });
  }

  // ── RefreshToken: 7 rows (one per driver, already expired) ────────────────
  for (let i = 0; i < 7; i++) {
    const existing = await prisma.refreshToken.findFirst({ where: { userId: drivers[i].id } });
    if (existing) continue;
    await prisma.refreshToken.create({
      data: {
        userId: drivers[i].id,
        token: crypto.randomBytes(40).toString("hex"),
        expiresAt: new Date(Date.now() - 86_400_000), // expired yesterday
      },
    });
  }

  // ── Summary ───────────────────────────────────────────────────────────────
  console.log("\n✅ Seed complete! Rows per table:");
  console.log("  User             : 7 passengers + 7 drivers + 1 admin = 15");
  console.log("  DriverProfile    : 7");
  console.log("  DriverDocument   : 7 drivers × 3 docs = 21");
  console.log("  Wallet           : 15 (one per user)");
  console.log("  WalletTransaction: 7 TRIP_PAYMENT + 7 TRIP_EARNING + 7 DEPOSIT + 6 WITHDRAWAL = 27");
  console.log("  Trip             : 7 completed + 1 cancelled = 8");
  console.log("  TripLocation     : 7 trips × 5 snapshots = 35");
  console.log("  Rating           : 7 passenger→driver + 7 driver→passenger = 14");
  console.log("  OtpToken         : 7");
  console.log("  RefreshToken     : 7");
  console.log("─────────────────────────────────────────────────────────────");
  console.log("Admin      → admin@dispatch.app           / Admin@1234");
  console.log("Passengers → thabo@dispatch.app … sello@dispatch.app  / Pass@1234");
  console.log("Drivers    → rethabile@dispatch.app … mamello@dispatch.app / Pass@1234");
  console.log("─────────────────────────────────────────────────────────────");
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
