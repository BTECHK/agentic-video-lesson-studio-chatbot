import type { Metadata } from "next";
import { Syne } from "next/font/google";
import "./globals.css";

const syne = Syne({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
  variable: "--font-syne",
});

export const metadata: Metadata = {
  title: "Tutor - Sample Academy AI Teaching Assistant",
  description:
    "Your AI teaching assistant for Sample Academy. Get answers grounded in course content with source citations.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${syne.variable} h-full`}>
      <body className="min-h-full flex flex-col" style={{ fontFamily: "var(--font)" }}>
        {children}
      </body>
    </html>
  );
}
