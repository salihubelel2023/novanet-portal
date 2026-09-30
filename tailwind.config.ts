import type { Config } from "tailwindcss";

// NovaNet design tokens.
// Palette is grounded in the product, not a generic SaaS default:
//   signal (emerald) = "connected / active" — the core status color of an ISP
//   fiber  (amber)   = warmth, energy, the physical glow of fiber light
//   sky    (cyan)    = reserved specifically for satellite / Starlink contexts
// Base is a cool charcoal-navy (not flat black) so dark mode reads as a
// network operations console rather than a generic dark template.
const config: Config = {
  darkMode: ["class"],
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    container: {
      center: true,
      padding: "1.5rem",
      screens: { "2xl": "1400px" },
    },
    extend: {
      fontFamily: {
        sans: ["var(--font-inter)", "system-ui", "sans-serif"],
        display: ["var(--font-space-grotesk)", "var(--font-inter)", "sans-serif"],
        mono: ["var(--font-jetbrains-mono)", "ui-monospace", "monospace"],
      },
      colors: {
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        surface: {
          DEFAULT: "hsl(var(--surface))",
          2: "hsl(var(--surface-2))",
        },
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        // Brand-specific semantic accents, distinct from generic shadcn tokens
        signal: {
          DEFAULT: "hsl(var(--signal))",
          strong: "hsl(var(--signal-strong))",
          foreground: "hsl(var(--signal-foreground))",
        },
        fiber: {
          DEFAULT: "hsl(var(--fiber))",
          foreground: "hsl(var(--fiber-foreground))",
        },
        sky: {
          DEFAULT: "hsl(var(--sky))",
          foreground: "hsl(var(--sky-foreground))",
        },
        success: "hsl(var(--signal))",
        warning: "hsl(var(--fiber))",
        danger: "hsl(var(--destructive))",
      },
      borderRadius: {
        xl: "calc(var(--radius) + 4px)",
        lg: "var(--radius)",
        md: "calc(var(--radius) - 3px)",
        sm: "calc(var(--radius) - 6px)",
      },
      boxShadow: {
        glow: "0 0 0 1px hsl(var(--signal) / 0.15), 0 8px 24px -8px hsl(var(--signal) / 0.35)",
        "glow-fiber": "0 0 0 1px hsl(var(--fiber) / 0.15), 0 8px 24px -8px hsl(var(--fiber) / 0.35)",
        card: "0 1px 2px 0 hsl(0 0% 0% / 0.04), 0 1px 1px 0 hsl(0 0% 0% / 0.03)",
        elevated: "0 12px 32px -12px hsl(0 0% 0% / 0.35)",
      },
      backgroundImage: {
        "grid-fade":
          "linear-gradient(to bottom, transparent, hsl(var(--background)) 90%), linear-gradient(to right, hsl(var(--border) / 0.4) 1px, transparent 1px), linear-gradient(to bottom, hsl(var(--border) / 0.4) 1px, transparent 1px)",
        "radial-fade": "radial-gradient(circle at 50% 0%, hsl(var(--signal) / 0.14), transparent 60%)",
      },
      keyframes: {
        "accordion-down": { from: { height: "0" }, to: { height: "var(--radix-accordion-content-height)" } },
        "accordion-up": { from: { height: "var(--radix-accordion-content-height)" }, to: { height: "0" } },
        "pulse-signal": {
          "0%, 100%": { opacity: "1", transform: "scale(1)" },
          "50%": { opacity: "0.5", transform: "scale(0.85)" },
        },
        "fade-up": {
          from: { opacity: "0", transform: "translateY(12px)" },
          to: { opacity: "1", transform: "translateY(0)" },
        },
        "dash-travel": {
          to: { strokeDashoffset: "0" },
        },
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
        "pulse-signal": "pulse-signal 2s cubic-bezier(0.4, 0, 0.6, 1) infinite",
        "fade-up": "fade-up 0.6s cubic-bezier(0.16, 1, 0.3, 1) both",
        "dash-travel": "dash-travel 3s linear infinite",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
};

export default config;
