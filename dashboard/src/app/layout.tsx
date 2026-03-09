import type { Metadata } from "next";
import "./globals.css";
import { Navigation } from "@/components/navigation";
import { AlertProvider } from "@/components/alert-provider";
import { PageTransition } from "@/components/page-transition";

export const metadata: Metadata = {
  title: "ATLAS | Phantom Agent",
  description:
    "Autonomous DeFi agent managing cross-chain capital allocation. Battle log, predictions, portfolio.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-background text-text antialiased">
        <Navigation />
        <AlertProvider />
        <main className="pt-14">
          <PageTransition>{children}</PageTransition>
        </main>
      </body>
    </html>
  );
}
