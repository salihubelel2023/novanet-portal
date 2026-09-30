import type { Role, UserStatus } from "@prisma/client";
import type { DefaultSession } from "next-auth";

declare module "next-auth" {
  interface User {
    id: string;
    role: Role;
    status: UserStatus;
  }

  interface Session {
    user: {
      id: string;
      role: Role;
      status: UserStatus;
    } & DefaultSession["user"];
  }
}

declare module "@auth/core/types" {
  interface User {
    id: string;
    role: Role;
    status: UserStatus;
  }

  interface Session {
    user: {
      id: string;
      role: Role;
      status: UserStatus;
    } & DefaultSession["user"];
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id: string;
    role: Role;
    status: UserStatus;
  }
}

declare module "@auth/core/jwt" {
  interface JWT {
    id: string;
    role: Role;
    status: UserStatus;
  }
}

