import "server-only";
import crypto from "crypto";
import { prisma } from "@/lib/prisma";
import { rateLimit } from "@/lib/rate-limit";
import { sendSms } from "@/lib/services/termii";

const CODE_TTL_MS = 10 * 60_000; // codes live 10 minutes
const MAX_ATTEMPTS = 5; // wrong entries allowed per code
const RESEND_LIMIT = 3; // codes requestable per window
const RESEND_WINDOW_MS = 10 * 60_000;

export class VerificationError extends Error {
  status: number;
  constructor(message: string, status = 400) {
    super(message);
    this.status = status;
  }
}

function hashCode(phone: string, code: string): string {
  return crypto.createHash("sha256").update(`${phone}:${code}`).digest("hex");
}

function generateCode(): string {
  // 6 numeric digits, no leading-zero bias concerns for a 1_000_000 space.
  return String(crypto.randomInt(0, 1_000_000)).padStart(6, "0");
}

export type IssuedCode = {
  expiresAt: Date;
  /** Only set when TERMII_API_KEY is missing (local dev) so the flow is testable. */
  devCode?: string;
};

/**
 * Issue a phone-verification OTP: invalidate the user's previous
 * unconsumed codes, store the new one hashed, and deliver it by SMS.
 */
export async function issuePhoneVerificationCode(userId: string): Promise<IssuedCode> {
  const limit = rateLimit(`verify:${userId}`, RESEND_LIMIT, RESEND_WINDOW_MS);
  if (!limit.ok) {
    throw new VerificationError("Too many code requests. Please wait a few minutes.", 429);
  }

  const user = await prisma.user.findUnique({ where: { id: userId }, select: { phone: true } });
  if (!user?.phone) {
    throw new VerificationError("Add a phone number in Settings first, then verify it.");
  }

  // Invalidate any previous outstanding codes for this user.
  await prisma.verificationCode.updateMany({
    where: { userId, purpose: "PHONE_VERIFY", consumedAt: null },
    data: { consumedAt: new Date() },
  });

  const code = generateCode();
  const expiresAt = new Date(Date.now() + CODE_TTL_MS);
  await prisma.verificationCode.create({
    data: {
      userId,
      phone: user.phone,
      codeHash: hashCode(user.phone, code),
      purpose: "PHONE_VERIFY",
      expiresAt,
    },
  });

  let devCode: string | undefined;
  try {
    const result = await sendSms(
      user.phone,
      `Your NovaNet verification code is ${code}. It expires in 10 minutes. Do not share it.`
    );
    if (!result.delivered) devCode = code; // dev fallback (no TERMII_API_KEY)
  } catch (err) {
    console.error("Verification SMS delivery failed:", err);
    throw new VerificationError("Could not send the verification SMS. Please try again.");
  }

  return { expiresAt, devCode };
}

/**
 * Confirm a phone-verification OTP. On success the code is consumed and
 * the user's phoneVerifiedAt is stamped.
 */
export async function verifyPhoneCode(userId: string, code: string): Promise<void> {
  const record = await prisma.verificationCode.findFirst({
    where: { userId, purpose: "PHONE_VERIFY", consumedAt: null },
    orderBy: { createdAt: "desc" },
  });
  if (!record) {
    throw new VerificationError("No active code. Request a new one.");
  }
  if (record.expiresAt.getTime() < Date.now()) {
    throw new VerificationError("That code has expired. Request a new one.");
  }
  if (record.attempts >= MAX_ATTEMPTS) {
    throw new VerificationError("Too many wrong attempts. Request a new code.");
  }

  if (record.codeHash !== hashCode(record.phone, code)) {
    await prisma.verificationCode.update({
      where: { id: record.id },
      data: { attempts: { increment: 1 } },
    });
    throw new VerificationError("That code is not correct.");
  }

  await prisma.$transaction([
    prisma.verificationCode.update({
      where: { id: record.id },
      data: { consumedAt: new Date() },
    }),
    prisma.user.update({
      where: { id: userId },
      data: { phoneVerifiedAt: new Date() },
    }),
  ]);
}
