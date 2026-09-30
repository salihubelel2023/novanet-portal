"use client";

import * as React from "react";
import { SessionProvider } from "next-auth/react";
import { Toaster } from "sonner";
import { ThemeProvider } from "@/components/providers/theme-provider";

export function AppProviders({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider>
      <ThemeProvider attribute="class" defaultTheme="dark" enableSystem disableTransitionOnChange>
        {children}
        <Toaster
          position="top-right"
          toastOptions={{
            classNames: {
              toast: "!bg-card !text-card-foreground !border-border",
              title: "!text-foreground",
              description: "!text-muted-foreground",
            },
          }}
        />
      </ThemeProvider>
    </SessionProvider>
  );
}
