import NextAuth, { type User as AuthUser } from "next-auth";
import Credentials from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { z } from "zod";
import type { Role, UserStatus } from "@prisma/client";
import { prisma } from "@/lib/prisma";

const credentialsSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

export const { handlers, auth, signIn, signOut } = NextAuth({
  // JWT sessions are required here because the Credentials provider has no
  // OAuth handshake for the database-adapter flow to hook into. If Google/
  // GitHub OAuth providers are added later, an @auth/prisma-adapter can be
  // layered in alongside this without changing the schema.
  session: { strategy: "jwt", maxAge: 30 * 24 * 60 * 60 },
  pages: {
    signIn: "/login",
    error: "/login",
  },
  providers: [
    Credentials({
      name: "Email and password",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(rawCredentials): Promise<AuthUser | null> {
        const parsed = credentialsSchema.safeParse(rawCredentials);
        if (!parsed.success) return null;
        const { email, password } = parsed.data;

        const user = await prisma.user.findUnique({
          where: { email: email.toLowerCase() },
        });
        if (!user) return null;

        const passwordsMatch = await bcrypt.compare(password, user.passwordHash);
        if (!passwordsMatch) return null;

        if (user.status === "SUSPENDED") {
          throw new Error("ACCOUNT_SUSPENDED");
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
  callbacks: {
    async jwt({ token, user }) {
      // `user` is only populated on the initial sign-in; persist the bits
      // we need into the token so subsequent requests don't hit the DB.
      if (user) {
        token.id = user.id as string;
        token.role = user.role;
        token.status = user.status;
      }
      return token;
    },
    async session({ session, token }) {
      session.user.id = token.id as string;
      session.user.role = token.role as Role;
      session.user.status = token.status as UserStatus;
      return session;
    },
  },
});
