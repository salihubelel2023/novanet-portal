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
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

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
    },
  });

  // ── Plans ─────────────────────────────────────────────────────────
  // Residential — priced per access point, differentiated by how many
  // devices that access point supports (per NovaNet's actual model).
  const [homeStarter, homePlus, homeMax] = await Promise.all([
    prisma.plan.create({
      data: {
        name: "Home Starter",
        description: "One shared access point, sized for a small household.",
        type: "RESIDENTIAL",
        price: 15000,
        billingCycle: "MONTHLY",
        speedMbps: 20,
        deviceLimit: 5,
        dataCapGB: null,
        features: ["Shared access point", "Free installation", "Standard support"],
        isActive: true,
        isPopular: false,
      },
    }),
    prisma.plan.create({
      data: {
        name: "Home Plus",
        description: "A dedicated access point for busier homes.",
        type: "RESIDENTIAL",
        price: 25000,
        billingCycle: "MONTHLY",
        speedMbps: 35,
        deviceLimit: 10,
        dataCapGB: null,
        features: ["Dedicated access point", "Priority support"],
        isActive: true,
        isPopular: true,
      },
    }),
    prisma.plan.create({
      data: {
        name: "Home Max",
        description: "Maximum speed and device headroom for large households.",
        type: "RESIDENTIAL",
        price: 40000,
        billingCycle: "MONTHLY",
        speedMbps: 50,
        deviceLimit: 20,
        dataCapGB: null,
        features: ["Dedicated access point", "Priority support", "Free relocation"],
        isActive: true,
        isPopular: false,
      },
    }),
  ]);

  // Business — needs vary a lot by trade, so these are starting points;
  // larger operations are expected to be quoted individually.
  const [bizStarter, bizPro, bizEnterprise] = await Promise.all([
    prisma.plan.create({
      data: {
        name: "Business Starter",
        description: "For small shops, salons and single-office setups.",
        type: "BUSINESS",
        price: 45000,
        billingCycle: "MONTHLY",
        speedMbps: 50,
        deviceLimit: 15,
        dataCapGB: null,
        features: ["Shared access point", "Business-hours support"],
        isActive: true,
        isPopular: false,
      },
    }),
    prisma.plan.create({
      data: {
        name: "Business Pro",
        description: "For restaurants, retail and co-working spaces.",
        type: "BUSINESS",
        price: 85000,
        billingCycle: "MONTHLY",
        speedMbps: 100,
        deviceLimit: 30,
        dataCapGB: null,
        features: ["Dedicated access point", "Priority SLA", "Static IP available"],
        isActive: true,
        isPopular: true,
      },
    }),
    prisma.plan.create({
      data: {
        name: "Business Enterprise",
        description: "For larger offices and multi-branch operations. Custom quotes available.",
        type: "BUSINESS",
        price: 150000,
        billingCycle: "MONTHLY",
        speedMbps: 200,
        deviceLimit: 60,
        dataCapGB: null,
        features: ["Dedicated access point", "24/7 priority SLA", "Static IP included"],
        isActive: true,
        isPopular: false,
      },
    }),
  ]);

  // Hotspot — pay-as-you-go vouchers, unlimited data on every tier,
  // differentiated purely by validity window.
  const [hour1, hour3, day1, week1, month1] = await Promise.all([
    prisma.plan.create({
      data: {
        name: "1 Hour Pass",
        description: "Quick top-up for a short session.",
        type: "HOTSPOT",
        price: 100,
        billingCycle: "HOURLY",
        durationHours: 1,
        speedMbps: 10,
        deviceLimit: 1,
        dataCapGB: null,
        features: ["Unlimited data"],
        isActive: true,
        isPopular: false,
      },
    }),
    prisma.plan.create({
      data: {
        name: "3 Hour Pass",
        description: "A few hours of unlimited access.",
        type: "HOTSPOT",
        price: 250,
        billingCycle: "HOURLY",
        durationHours: 3,
        speedMbps: 10,
        deviceLimit: 1,
        dataCapGB: null,
        features: ["Unlimited data"],
        isActive: true,
        isPopular: false,
      },
    }),
    prisma.plan.create({
      data: {
        name: "Full Day Pass",
        description: "Unlimited access for 24 hours.",
        type: "HOTSPOT",
        price: 500,
        billingCycle: "DAILY",
        durationHours: 24,
        speedMbps: 10,
        deviceLimit: 1,
        dataCapGB: null,
        features: ["Unlimited data"],
        isActive: true,
        isPopular: true,
      },
    }),
    prisma.plan.create({
      data: {
        name: "Weekly Pass",
        description: "A full week of unlimited hotspot access.",
        type: "HOTSPOT",
        price: 2500,
        billingCycle: "WEEKLY",
        durationHours: 168,
        speedMbps: 10,
        deviceLimit: 1,
        dataCapGB: null,
        features: ["Unlimited data"],
        isActive: true,
        isPopular: false,
      },
    }),
    prisma.plan.create({
      data: {
        name: "Monthly Pass",
        description: "The best value for regular hotspot users.",
        type: "HOTSPOT",
        price: 8000,
        billingCycle: "MONTHLY",
        durationHours: 720,
        speedMbps: 10,
        deviceLimit: 1,
        dataCapGB: null,
        features: ["Unlimited data"],
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

  await seedPaidSubscription(resident.id, homePlus);
  await seedPaidSubscription(business.id, bizPro);

  // ── Hotspot vouchers ──────────────────────────────────────────────
  const batch = await prisma.voucherBatch.create({
    data: { name: "Santos Estate Kiosk — Launch Batch", quantity: 20, planId: day1.id, generatedById: admin.id },
  });

  const voucherCodes = Array.from({ length: 20 }, () => generateVoucherCode());
  await prisma.hotspotVoucher.createMany({
    data: voucherCodes.map((code) => ({
      code,
      batchId: batch.id,
      planId: day1.id,
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
      planId: hour3.id,
      durationHours: 3,
      dataCapMB: null,
      price: 250,
      generatedById: admin.id,
      redeemedById: hotspotUser.id,
      status: "ACTIVE",
      redeemedAt,
      activatedAt: redeemedAt,
      expiresAt: new Date(redeemedAt.getTime() + 3 * 60 * 60 * 1000),
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
  console.log(`  Plans:     ${[homeStarter, homePlus, homeMax, bizStarter, bizPro, bizEnterprise, hour1, hour3, day1, week1, month1].length}`);
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
