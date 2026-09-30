import "server-only";
import { prisma } from "@/lib/prisma";
import { notifyUser } from "@/lib/services/notification";
import { getMikrotikClient } from "@/lib/services/mikrotik";
import { formatDate } from "@/lib/utils";

export interface LifecycleRunResult {
  timestamp: string;
  expiredSubscriptions: number;
  expiredVouchers: number;
  expirationWarningsSent: number;
  errors: string[];
}

/**
 * Sweeps the database for expired subscriptions and vouchers,
 * updates statuses, notifies users, and deprovisions active network sessions.
 */
export async function processSubscriptionLifecycle(): Promise<LifecycleRunResult> {
  const now = new Date();
  const errors: string[] = [];
  let expiredSubscriptions = 0;
  let expiredVouchers = 0;
  let expirationWarningsSent = 0;

  // ─────────────────────────────────────────────────────────────────────────────
  // 1. Expire Overdue Subscriptions
  // ─────────────────────────────────────────────────────────────────────────────
  const overdueSubscriptions = await prisma.subscription.findMany({
    where: {
      status: "ACTIVE",
      endDate: {
        lte: now,
      },
    },
    include: {
      user: true,
      plan: true,
    },
  });

  for (const sub of overdueSubscriptions) {
    try {
      await prisma.$transaction(async (tx) => {
        await tx.subscription.update({
          where: { id: sub.id },
          data: { status: "EXPIRED" },
        });

        await tx.auditLog.create({
          data: {
            userId: sub.userId,
            action: "SUBSCRIPTION_EXPIRED",
            entityType: "Subscription",
            entityId: sub.id,
            metadata: {
              planName: sub.plan.name,
              planType: sub.plan.type,
              endDate: sub.endDate?.toISOString(),
              autoRenew: sub.autoRenew,
            },
          },
        });
      });

      expiredSubscriptions++;

      await notifyUser({
        userId: sub.userId,
        title: "Subscription expired",
        message: `Your ${sub.plan.name} subscription expired on ${sub.endDate ? formatDate(sub.endDate) : "schedule"}. Please renew to restore high-speed access.`,
        type: "SUBSCRIPTION",
        link: "/dashboard/subscriptions",
      });
    } catch (err) {
      console.error(`[Lifecycle] Failed to expire subscription ${sub.id}:`, err);
      errors.push(`Subscription ${sub.id}: ${(err as Error).message}`);
    }
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // 2. Expire Overdue Hotspot Vouchers
  // ─────────────────────────────────────────────────────────────────────────────
  const overdueVouchers = await prisma.hotspotVoucher.findMany({
    where: {
      status: "ACTIVE",
      expiresAt: {
        lte: now,
      },
    },
    include: {
      plan: true,
      redeemedBy: true,
    },
  });

  const mikrotik = getMikrotikClient();
  let mikrotikActiveSessions: { id: string; user: string }[] = [];
  if (mikrotik && overdueVouchers.length > 0) {
    try {
      mikrotikActiveSessions = await mikrotik.listActiveHotspotUsers();
    } catch (err) {
      console.warn("[Lifecycle] Could not fetch active MikroTik sessions:", err);
    }
  }

  for (const voucher of overdueVouchers) {
    try {
      await prisma.hotspotVoucher.update({
        where: { id: voucher.id },
        data: { status: "EXPIRED" },
      });
      expiredVouchers++;

      // Disable voucher user and drop any active session on MikroTik
      if (mikrotik) {
        try {
          await mikrotik.disableHotspotUserByName(voucher.code);
          const activeSession = mikrotikActiveSessions.find((s) => s.user === voucher.code);
          if (activeSession) {
            await mikrotik.disconnectActiveUser(activeSession.id);
          }
        } catch (mkErr) {
          console.warn(`[Lifecycle] MikroTik deauth failed for voucher ${voucher.code}:`, mkErr);
        }
      }

      if (voucher.redeemedById) {
        await notifyUser({
          userId: voucher.redeemedById,
          title: "Voucher expired",
          message: `Your Wi-Fi voucher (${voucher.code}) for ${voucher.plan.name} has expired.`,
          type: "VOUCHER",
          link: "/dashboard/vouchers",
        });
      }
    } catch (err) {
      console.error(`[Lifecycle] Failed to expire voucher ${voucher.id}:`, err);
      errors.push(`Voucher ${voucher.id}: ${(err as Error).message}`);
    }
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // 3. Proactive Warnings: Subscriptions Expiring Soon (Within 3 Days)
  // ─────────────────────────────────────────────────────────────────────────────
  const threeDaysFromNow = new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000);
  const expiringSoonSubscriptions = await prisma.subscription.findMany({
    where: {
      status: "ACTIVE",
      endDate: {
        gt: now,
        lte: threeDaysFromNow,
      },
    },
    include: {
      plan: true,
      user: true,
    },
  });

  for (const sub of expiringSoonSubscriptions) {
    try {
      // Avoid duplicate reminders: check if an alert was already generated within the last 24h
      const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
      const recentWarning = await prisma.notification.findFirst({
        where: {
          userId: sub.userId,
          type: "SUBSCRIPTION",
          title: "Subscription expiring soon",
          createdAt: { gte: oneDayAgo },
        },
      });

      if (!recentWarning && sub.endDate) {
        await notifyUser({
          userId: sub.userId,
          title: "Subscription expiring soon",
          message: `Your ${sub.plan.name} plan expires on ${formatDate(sub.endDate)}. Renew now to prevent any downtime.`,
          type: "SUBSCRIPTION",
          link: "/dashboard/subscriptions",
        });
        expirationWarningsSent++;
      }
    } catch (err) {
      console.error(`[Lifecycle] Failed to send reminder for subscription ${sub.id}:`, err);
      errors.push(`Warning for sub ${sub.id}: ${(err as Error).message}`);
    }
  }

  return {
    timestamp: now.toISOString(),
    expiredSubscriptions,
    expiredVouchers,
    expirationWarningsSent,
    errors,
  };
}
