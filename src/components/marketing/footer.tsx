import Link from "next/link";
import { Wifi, Mail, Phone } from "lucide-react";
import { SUPPORT_EMAIL, SUPPORT_PHONE, WHATSAPP_LINK } from "@/lib/constants";

const COLUMNS = [
  {
    title: "Product",
    links: [
      { label: "Features", href: "#features" },
      { label: "Pricing", href: "#pricing" },
      { label: "Redeem voucher", href: "/redeem" },
    ],
  },
  {
    title: "Account",
    links: [
      { label: "Log in", href: "/login" },
      { label: "Create account", href: "/register" },
    ],
  },
  {
    title: "Contact",
    links: [
      { label: SUPPORT_EMAIL, href: `mailto:${SUPPORT_EMAIL}` },
      { label: `Call ${SUPPORT_PHONE}`, href: `tel:${SUPPORT_PHONE}` },
      { label: "WhatsApp us", href: WHATSAPP_LINK },
    ],
  },
];

export function Footer() {
  return (
    <footer className="border-t border-border py-14">
      <div className="container-page">
        <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-4">
          <div>
            <Link href="/" className="flex items-center gap-2">
              <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-signal/15 text-signal">
                <Wifi className="h-4 w-4" />
              </span>
              <span className="font-display text-base font-semibold tracking-tight">NovaNet</span>
            </Link>
            <p className="mt-4 max-w-xs text-sm text-muted-foreground">
              Managed internet for estates, businesses and hotspot users across Nigeria.
            </p>
            <div className="mt-4 space-y-1.5 text-xs text-muted-foreground">
              <p className="flex items-center gap-1.5">
                <Mail className="h-3.5 w-3.5" /> {SUPPORT_EMAIL}
              </p>
              <p className="flex items-center gap-1.5">
                <Phone className="h-3.5 w-3.5" /> {SUPPORT_PHONE}
              </p>
            </div>
          </div>
          {COLUMNS.map((col) => (
            <div key={col.title}>
              <h4 className="text-sm font-semibold">{col.title}</h4>
              <ul className="mt-4 space-y-3">
                {col.links.map((link) => (
                  <li key={link.label}>
                    <Link href={link.href} className="text-sm text-muted-foreground hover:text-foreground">
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
        <div className="mt-12 flex flex-col items-center justify-between gap-4 border-t border-border pt-6 text-xs text-muted-foreground sm:flex-row">
          <p>© {new Date().getFullYear()} NovaNet Communications Ltd. All rights reserved.</p>
          <p>HQ: Abuja, FCT, Nigeria</p>
        </div>
      </div>
    </footer>
  );
}
