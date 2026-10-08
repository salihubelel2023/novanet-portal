import type { NextAuthConfig } from "next-auth";
import type { Role, UserStatus } from "@prisma/client";

// Edge-safe config: shared by middleware and by auth.ts.
// Do NOT import prisma, bcrypt or anything that touches the database here.
export const authConfig = {
    session: { strategy: "jwt", maxAge: 30 * 24 * 60 * 60 },
    pages: {
        signIn: "/login",
        error: "/login",
    },
    providers: [], // the Credentials provider is added in auth.ts
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
} satisfies NextAuthConfig;