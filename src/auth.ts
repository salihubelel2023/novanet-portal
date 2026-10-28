import NextAuth, { type User as AuthUser } from "next-auth";
import { CredentialsSignin } from "next-auth";
import Credentials from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { authConfig } from "@/auth.config";
import { getClientIp, rateLimit } from "@/lib/rate-limit";

const credentialsSchema = z.object({
  email: z.email(),
  password: z.string().min(1),
});

/**
 * Auth.js only surfaces the `code` of CredentialsSignin errors to the
 * client (via result.code in next-auth/react), so domain-specific login
 * failures must ride on this mechanism to show friendly messages.
 */
class RateLimitedError extends CredentialsSignin {
  code = "RATE_LIMITED";
}

class AccountSuspendedError extends CredentialsSignin {
  code = "ACCOUNT_SUSPENDED";
}

/** Failed login attempts allowed per email before throttling. */
const LOGIN_EMAIL_LIMIT = 10;
/** Login attempts allowed per IP across all emails (stuffing protection). */
const LOGIN_IP_LIMIT = 30;
const LOGIN_WINDOW_MS = 15 * 60_000;

export const { handlers, auth, signIn, signOut } = NextAuth({
  ...authConfig,
  providers: [
    Credentials({
      name: "Email and password",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(rawCredentials, request): Promise<AuthUser | null> {
        const parsed = credentialsSchema.safeParse(rawCredentials);
        if (!parsed.success) return null;
        const { email, password } = parsed.data;
        const normalizedEmail = email.toLowerCase();

        // Throttle before touching bcrypt or the database so brute-force
        // attempts are rejected as cheaply as possible.
        const perEmail = rateLimit(`login:email:${normalizedEmail}`, LOGIN_EMAIL_LIMIT, LOGIN_WINDOW_MS);
        const perIp = rateLimit(`login:ip:${getClientIp(request)}`, LOGIN_IP_LIMIT, LOGIN_WINDOW_MS);
        if (!perEmail.ok || !perIp.ok) {
          throw new RateLimitedError();
        }

        const user = await prisma.user.findUnique({
          where: { email: normalizedEmail },
        });
        if (!user) return null;

        const passwordsMatch = await bcrypt.compare(password, user.passwordHash);
        if (!passwordsMatch) return null;

        if (user.status === "SUSPENDED") {
          throw new AccountSuspendedError();
        }

        return {
          id: user.id,
          name: user.name,
          email: user.email,
          image: user.image,
          role: user.role,
          status: user.status,
        };
      },
    }),
  ],
});