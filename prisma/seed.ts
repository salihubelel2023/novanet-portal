/**
 * NovaNet Portal — database seed
 *
 * Run with: npm run db:seed  (wraps `tsx prisma/seed.ts`)
 *
 * This is written as a standalone script (not run through Next.js), so it
 * deliberately avoids the `@/` path alias and duplicates two tiny helper
 * functions from src/lib/utils.ts rather than risk an import-resolution
 * mismatch between tsx and the Next build pipeline.
 *
 * DEMO LOGIN — every seeded account shares this password. Change or
 * remove these accounts before deploying anywhere real:
 *   Password: NovaNet@2026
 */
import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import bcrypt from "bcryptjs";

const adapter = new PrismaPg({
  connectionString: process.env.DATABASE_URL,
});
const prisma = new PrismaClient({ adapter });

const VOUCHER_ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"; // no 0/O/1/I ambiguity
function generateVoucherCode(): string {
  const part = () =>
    Array.from({ length: 4 }, () => VOUCHER_ALPHABET[Math.floor(Math.random() * VOUCHER_ALPHABET.length)]).join("");
  return `NVN-${part()}-${part()}`;
}
function generateReference(prefix: string): string {
  const ts = Date.now().toString(36).toUpperCase();
  const rand = Math.random().toString(36).slice(2, 8).toUpperCase();
  return `${prefix}-${ts}-${rand}`;
}

const DEMO_PASSWORD = "NovaNet@2026";

async function main() {
  console.log("Seeding NovaNet Portal…");

  // ── Clean slate (children before parents, FK-safe order) ────────────
  await prisma.auditLog.deleteMany();
  await prisma.ticketMessage.deleteMany();
  await prisma.supportTicket.deleteMany();
  await prisma.notification.deleteMany();
  await prisma.technicianJob.deleteMany();
  await prisma.networkDevice.deleteMany();
  await prisma.hotspotVoucher.deleteMany();
  await prisma.voucherBatch.deleteMany();
  await prisma.invoice.deleteMany();
  await prisma.payment.deleteMany();
  await prisma.subscription.deleteMany();
  await prisma.plan.deleteMany();
  await prisma.user.deleteMany();
  await prisma.estate.deleteMany();

  // ── Estate ────────────────────────────────────────────────────────
  const santosEstate = await prisma.estate.create({
    data: {
      name: "Santos Estate",
      address: "Santos Estate, Dakwo District",
      city: "Abuja",
      state: "FCT (Abuja)",
      district: "ESTATE",
    },
  });

  // ── Plans ─────────────────────────────────────────────────────────
  // ABUJA DISTRICT PRICING (Residential & Business) + Hotspot Vouchers

  // 1. Premium Diplomatic (Maitama, Asokoro, Guzape, Katampe Ext)
  // 2. Commercial Hubs (Wuse II, CBD, Jabi, Utako)
  // 3. High-Growth Gated Estates (Mabushi, Lifecamp, Wuye, Lugbe, Lokogama, Kyami)
  const [resDiplomatic, resCommercial, resEstate] = await Promise.all([
    prisma.plan.create({
      data: {
        name: "Resident — Diplomatic Luxury",
        description: "Maitama, Asokoro, Guzape & Katampe Ext. High burst speeds for smart homes.",
        type: "RESIDENTIAL",
        district: "DIPLOMATIC",
        price: 50000,
        billingCycle: "MONTHLY",
        speedMbps: 100,
        deviceLimit: 30,
        dataCapGB: null,
        features: ["High burst speeds for smart homes", "Unlimited fiber data", "Dedicated access point", "24/7 VIP priority support"],
        isActive: true,
        isPopular: false,
      },
    }),
    prisma.plan.create({
      data: {
        name: "Resident — Commercial Hub",
        description: "Wuse II, CBD, Jabi & Utako. High-speed urban fiber for residential apartments.",
        type: "RESIDENTIAL",
        district: "COMMERCIAL",
        price: 40000,
        billingCycle: "MONTHLY",
        speedMbps: 60,
        deviceLimit: 15,
        dataCapGB: null,
        features: ["High-speed urban fiber", "Unlimited data", "Dedicated access point", "Priority support"],
        isActive: true,
        isPopular: true,
      },
    }),
    prisma.plan.create({
      data: {
        name: "Resident — Gated Estate",
        description: "Mabushi, Lifecamp, Wuye, Lugbe, Lokogama & Kyami. Competitive mass-market pricing.",
        type: "RESIDENTIAL",
        district: "ESTATE",
        price: 30000,
        billingCycle: "MONTHLY",
        speedMbps: 35,
        deviceLimit: 10,
        dataCapGB: null,
        features: ["Competitive mass-market pricing", "Unlimited data", "Free installation", "Standard support"],
        isActive: true,
        isPopular: false,
      },
    }),
  ]);

  const [bizDiplomatic, bizCommercial, bizEstate] = await Promise.all([
    prisma.plan.create({
      data: {
        name: "Business — Diplomatic Enterprise",
        description: "Maitama, Asokoro, Guzape & Katampe Ext. Mission-critical enterprise fiber.",
        type: "BUSINESS",
        district: "DIPLOMATIC",
        price: 100000,
        billingCycle: "MONTHLY",
        speedMbps: 200,
        deviceLimit: 60,
        dataCapGB: null,
        features: ["Dedicated enterprise fiber", "Static IP included", "24/7 priority SLA", "Zero-downtime redundancy"],
        isActive: true,
        isPopular: false,
      },
    }),
    prisma.plan.create({
      data: {
        name: "Business — Commercial Hub",
        description: "Wuse II, CBD, Jabi & Utako. Dedicated priority queues for offices and retail POS.",
        type: "BUSINESS",
        district: "COMMERCIAL",
        price: 75000,
        billingCycle: "MONTHLY",
        speedMbps: 120,
        deviceLimit: 40,
        dataCapGB: null,
        features: ["Dedicated priority queues for POS & retail", "High-throughput office bandwidth", "Static IP available", "Priority business SLA"],
        isActive: true,
        isPopular: true,
      },
    }),
    prisma.plan.create({
      data: {
        name: "Business — Gated Estate",
        description: "Mabushi, Lifecamp, Wuye, Lugbe, Lokogama & Kyami. Commercial plaza, clinic & SME retail connectivity.",
        type: "BUSINESS",
        district: "ESTATE",
        price: 60000,
        billingCycle: "MONTHLY",
        speedMbps: 75,
        deviceLimit: 25,
        dataCapGB: null,
        features: ["Estate commercial center & SME plan", "Reliable POS uptime", "Unlimited data", "Standard business SLA"],
        isActive: true,
        isPopular: false,
      },
    }),
  ]);

  // Hotspot — unlimited data, speed capped across 3 tiers
  const [hotspotDaily, hotspotWeekly, hotspotMonthly] = await Promise.all([
    prisma.plan.create({
      data: {
        name: "Hotspot Daily (5 Mbps)",
        description: "Unlimited data for 24 hours, speed capped at 5 Mbps.",
        type: "HOTSPOT",
        price: 500,
        billingCycle: "DAILY",
        durationHours: 24,
        speedMbps: 5,
        deviceLimit: 1,
        dataCapGB: null,
        features: ["Unlimited data", "Speed capped at 5 Mbps", "24-hour validity"],
        isActive: true,
        isPopular: false,
      },
    }),
    prisma.plan.create({
      data: {
        name: "Hotspot Weekly (10 Mbps)",
        description: "Unlimited data for 7 days, speed capped at 10 Mbps.",
        type: "HOTSPOT",
        price: 2500,
        billingCycle: "WEEKLY",
        durationHours: 168,
        speedMbps: 10,
        deviceLimit: 1,
        dataCapGB: null,
        features: ["Unlimited data", "Speed capped at 10 Mbps", "7-day validity"],
        isActive: true,
        isPopular: true,
      },
    }),
    prisma.plan.create({
      data: {
        name: "Hotspot Monthly (25 Mbps)",
        description: "Unlimited data for 30 days, high speed capped at 25 Mbps.",
        type: "HOTSPOT",
        price: 8000,
        billingCycle: "MONTHLY",
        durationHours: 720,
        speedMbps: 25,
        deviceLimit: 1,
        dataCapGB: null,
        features: ["Unlimited data", "Speed capped at 25 Mbps", "30-day validity"],
        isActive: true,
        isPopular: false,
      },
    }),
  ]);

  // ── Users (all share DEMO_PASSWORD) ──────────────────────────────
  const passwordHash = await bcrypt.hash(DEMO_PASSWORD, 10);

  const admin = await prisma.user.create({
    data: {
      name: "NovaNet Admin",
      email: "admin@novanet.ng",
      phone: "+2349132376668",
      passwordHash,
      role: "ADMIN",
      status: "ACTIVE",
    },
  });

  const technician = await prisma.user.create({
    data: {
      name: "Ibrahim Musa",
      email: "tech@novanet.ng",
      phone: "+2348011122233",
      passwordHash,
      role: "TECHNICIAN",
      status: "ACTIVE",
    },
  });

  const resident = await prisma.user.create({
    data: {
      name: "Ngozi Chukwu",
      email: "resident@novanet.ng",
      phone: "+2348022233344",
      passwordHash,
      role: "RESIDENT",
      status: "ACTIVE",
      address: "Block 4, Santos Estate, Dakwo, Abuja",
      district: "ESTATE",
      estateId: santosEstate.id,
    },
  });

  const business = await prisma.user.create({
    data: {
      name: "Adewale Okafor",
      email: "business@novanet.ng",
      phone: "+2348033344455",
      passwordHash,
      role: "BUSINESS",
      status: "ACTIVE",
      businessName: "Okafor Fashion Store",
      address: "Shop 12, Dakwo District Market, Abuja",
      district: "COMMERCIAL",
      estateId: santosEstate.id,
    },
  });

  const hotspotUser = await prisma.user.create({
    data: {
      name: "Fatima Bello",
      email: "hotspot@novanet.ng",
      phone: "+2348044455566",
      passwordHash,
      role: "HOTSPOT_USER",
      status: "ACTIVE",
    },
  });

  // ── Subscriptions, payments & invoices ───────────────────────────
  const now = new Date();
  const in30Days = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);

  async function seedPaidSubscription(userId: string, plan: { id: string; price: unknown; name: string }) {
    const subscription = await prisma.subscription.create({
      data: { userId, planId: plan.id, status: "ACTIVE", startDate: now, endDate: in30Days, autoRenew: true },
    });
    const payment = await prisma.payment.create({
      data: {
        reference: generateReference("SUB"),
        userId,
        subscriptionId: subscription.id,
        amount: plan.price as never,
        provider: "PAYSTACK",
        purpose: "SUBSCRIPTION",
        status: "SUCCESS",
        channel: "card",
        paidAt: now,
      },
    });
    await prisma.invoice.create({
      data: {
        invoiceNumber: `INV-${now.getFullYear()}-${String(Math.floor(Math.random() * 900000) + 100000)}`,
        userId,
        subscriptionId: subscription.id,
        paymentId: payment.id,
        amount: plan.price as never,
        tax: 0,
        total: plan.price as never,
        status: "PAID",
        description: `${plan.name} subscription`,
        dueDate: now,
        issuedAt: now,
      },
    });
    return subscription;
  }

  await seedPaidSubscription(resident.id, resCommercial);
  await seedPaidSubscription(business.id, bizCommercial);

  // ── Hotspot vouchers ──────────────────────────────────────────────
  const batch = await prisma.voucherBatch.create({
    data: { name: "Santos Estate Kiosk — Launch Batch", quantity: 20, planId: hotspotDaily.id, generatedById: admin.id },
  });

  const voucherCodes = Array.from({ length: 20 }, () => generateVoucherCode());
  await prisma.hotspotVoucher.createMany({
    data: voucherCodes.map((code) => ({
      code,
      batchId: batch.id,
      planId: hotspotDaily.id,
      durationHours: 24,
      dataCapMB: null,
      price: 500,
      generatedById: admin.id,
      status: "UNUSED" as const,
    })),
  });

  // One already redeemed by the demo hotspot user, so their dashboard
  // isn't empty on first login.
  const redeemedAt = new Date(now.getTime() - 2 * 60 * 60 * 1000);
  await prisma.hotspotVoucher.create({
    data: {
      code: generateVoucherCode(),
      planId: hotspotDaily.id,
      durationHours: 24,
      dataCapMB: null,
      price: 500,
      generatedById: admin.id,
      redeemedById: hotspotUser.id,
      status: "ACTIVE",
      redeemedAt,
      activatedAt: redeemedAt,
      expiresAt: new Date(redeemedAt.getTime() + 24 * 60 * 60 * 1000),
    },
  });

  // ── Network devices ───────────────────────────────────────────────
  const router = await prisma.networkDevice.create({
    data: {
      name: "Santos Estate Core Router",
      type: "MIKROTIK_ROUTER",
      location: "Estate NOC, Santos Estate, Dakwo",
      ipAddress: "10.10.0.1",
      estateId: santosEstate.id,
      status: "ONLINE",
      lastSeenAt: now,
    },
  });

  await prisma.networkDevice.create({
    data: {
      name: "Santos Estate Starlink #1",
      type: "STARLINK_DISH",
      location: "Estate NOC rooftop, Santos Estate",
      estateId: santosEstate.id,
      status: "ONLINE",
      lastSeenAt: now,
    },
  });

  // ── Technician job ────────────────────────────────────────────────
  await prisma.technicianJob.create({
    data: {
      jobNumber: generateReference("JOB"),
      type: "INSTALLATION",
      status: "COMPLETED",
      technicianId: technician.id,
      userId: resident.id,
      deviceId: router.id,
      estateId: santosEstate.id,
      notes: "Initial access point install for Block 4 — line of sight confirmed to estate mast.",
      scheduledAt: new Date(now.getTime() - 5 * 24 * 60 * 60 * 1000),
      completedAt: new Date(now.getTime() - 5 * 24 * 60 * 60 * 1000 + 3 * 60 * 60 * 1000),
    },
  });

  // ── Support ticket with a short thread ───────────────────────────
  const ticket = await prisma.supportTicket.create({
    data: {
      ticketNumber: generateReference("TKT"),
      userId: resident.id,
      subject: "Speed drops in the evening",
      description: "Connection is great during the day but slows down significantly after 7pm.",
      category: "TECHNICAL",
      priority: "MEDIUM",
      status: "IN_PROGRESS",
      assignedToId: technician.id,
    },
  });
  await prisma.ticketMessage.create({
    data: {
      ticketId: ticket.id,
      senderId: resident.id,
      message: "Just started happening this week — is this a congestion issue on the estate link?",
    },
  });
  await prisma.ticketMessage.create({
    data: {
      ticketId: ticket.id,
      senderId: technician.id,
      message: "Thanks for flagging — checking the router's peak-hour load now, will update you shortly.",
    },
  });

  // ── Notifications ─────────────────────────────────────────────────
  await prisma.notification.createMany({
    data: [
      {
        userId: resident.id,
        title: "Payment successful",
        message: "Your Home Plus subscription is now active.",
        type: "PAYMENT",
        link: "/dashboard/subscriptions",
      },
      {
        userId: business.id,
        title: "Payment successful",
        message: "Your Business Pro subscription is now active.",
        type: "PAYMENT",
        link: "/dashboard/subscriptions",
      },
      {
        userId: hotspotUser.id,
        title: "Voucher redeemed",
        message: "Your 3 Hour Pass is now active.",
        type: "VOUCHER",
        link: "/dashboard/vouchers",
      },
      {
        userId: admin.id,
        title: "New support ticket",
        message: "Speed drops in the evening",
        type: "TICKET",
        link: `/dashboard/support/${ticket.id}`,
      },
    ],
  });

  console.log("Seed complete:");
  console.log(`  Estate:    ${santosEstate.name}, ${santosEstate.city}`);
  console.log(`  Plans:     ${[resDiplomatic, resCommercial, resEstate, bizDiplomatic, bizCommercial, bizEstate, hotspotDaily, hotspotWeekly, hotspotMonthly].length}`);
  console.log(`  Vouchers:  ${voucherCodes.length + 1}`);
  console.log("");
  console.log("  Demo logins (password for all: NovaNet@2026):");
  console.log(`    Admin        admin@novanet.ng`);
  console.log(`    Technician   tech@novanet.ng`);
  console.log(`    Resident     resident@novanet.ng`);
  console.log(`    Business     business@novanet.ng`);
  console.log(`    Hotspot user hotspot@novanet.ng`);
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
