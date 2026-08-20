import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { GlobalNav } from "@/components/GlobalNav";
import "katex/dist/katex.min.css";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "AI Engineering Lab",
  description:
    "Build, evaluate, optimize, deploy, monitor and improve AI systems — one integrated lab across five connected modules.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-white text-neutral-900">
        <GlobalNav />
        <main className="flex-1 mx-auto w-full max-w-6xl px-3 sm:px-4 py-5 sm:py-8">{children}</main>
      </body>
    </html>
  );
}
