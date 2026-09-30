import "server-only";
import { prisma } from "@/lib/prisma";
import type { NotificationType } from "@prisma/client";

export async function notifyUser(params: {
  userId: string;
  title: string;
  message: string;
  type?: NotificationType;
  link?: string;
}) {
  return prisma.notification.create({
    data: {
      userId: params.userId,
      title: params.title,
      message: params.message,
      type: params.type ?? "INFO",
      link: params.link,
    },
  });
}

export async function notifyRole(params: {
  role: "ADMIN" | "TECHNICIAN";
  title: string;
  message: string;
  type?: NotificationType;
  link?: string;
}) {
  const users = await prisma.user.findMany({
    where: { role: params.role, status: "ACTIVE" },
    select: { id: true },
  });
  if (users.length === 0) return;
  await prisma.notification.createMany({
    data: users.map((u) => ({
      userId: u.id,
      title: params.title,
      message: params.message,
      type: params.type ?? "INFO",
      link: params.link,
    })),
  });
}
