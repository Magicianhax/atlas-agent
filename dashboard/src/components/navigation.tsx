"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { Menu, X } from "lucide-react";
import { cn } from "@/lib/utils";

const navLinks = [
  { href: "/", label: "LIVE BRAIN", icon: ">" },
  { href: "/predictions", label: "PREDICTIONS", icon: "?" },
  { href: "/portfolio", label: "PORTFOLIO", icon: "$" },
  { href: "/strategy", label: "STRATEGY", icon: "!" },
  { href: "/about", label: "ABOUT", icon: "i" },
];

export function Navigation() {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);

  function isActive(href: string) {
    if (href === "/") return pathname === "/";
    return pathname.startsWith(href);
  }

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 h-14 bg-[#0d0d0d]/95 backdrop-blur-sm border-b-2 border-crimson">
      <div className="mx-auto flex h-full max-w-7xl items-center justify-between px-4">
        {/* Logo with mascot */}
        <Link href="/" className="flex items-center gap-2.5 group">
          <div className="relative h-9 w-9 rounded-sm overflow-hidden border border-crimson/50 group-hover:border-gold transition-colors">
            <Image
              src="/assets/mascot-avatar.png"
              alt="ATLAS"
              width={36}
              height={36}
              className="object-cover"
              priority
            />
          </div>
          <div className="flex flex-col leading-none">
            <span
              className="text-lg font-black tracking-[0.2em] text-crimson"
              style={{ fontFamily: "var(--font-heading)" }}
            >
              ATLAS
            </span>
            <span className="text-[8px] uppercase tracking-[0.3em] text-gold-dim">
              Phantom Agent
            </span>
          </div>
        </Link>

        {/* Desktop links — angular P5 style */}
        <div className="hidden items-center gap-0.5 md:flex">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={cn(
                "relative px-4 py-1.5 text-xs font-bold uppercase tracking-wider transition-all",
                "skew-x-[-3deg]",
                isActive(link.href)
                  ? "bg-crimson text-white"
                  : "text-text-muted hover:text-text hover:bg-surface-light"
              )}
            >
              <span className="inline-block skew-x-[3deg]">
                {link.label}
              </span>
              {isActive(link.href) && (
                <span className="absolute -bottom-0.5 left-2 right-2 h-0.5 bg-gold skew-x-[3deg]" />
              )}
            </Link>
          ))}
        </div>

        {/* Mobile hamburger */}
        <button
          className="flex items-center justify-center md:hidden text-crimson hover:text-gold transition-colors"
          onClick={() => setMobileOpen((prev) => !prev)}
          aria-label="Toggle navigation"
        >
          {mobileOpen ? <X size={20} /> : <Menu size={20} />}
        </button>
      </div>

      {/* Mobile menu */}
      {mobileOpen && (
        <div className="border-b-2 border-crimson bg-[#0d0d0d]/98 backdrop-blur-md md:hidden">
          <div className="mx-auto flex max-w-7xl flex-col px-4 py-3 gap-1">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setMobileOpen(false)}
                className={cn(
                  "px-3 py-2 text-xs font-bold uppercase tracking-wider transition-colors",
                  isActive(link.href)
                    ? "bg-crimson text-white"
                    : "text-text-muted hover:bg-surface-light hover:text-text"
                )}
              >
                <span className="text-gold mr-2">{link.icon}</span>
                {link.label}
              </Link>
            ))}
          </div>
        </div>
      )}
    </nav>
  );
}
