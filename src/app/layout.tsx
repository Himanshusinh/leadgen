import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "LeadGen — Find & enrich B2B leads",
  description: "Generate, enrich and verify leads by industry and location.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
