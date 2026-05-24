import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { ChatProvider } from "@/context/ChatContext";
import { AuthModal } from "@/components/AuthModal";
import { ProfileModal } from "@/components/ProfileModal";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Pizza Bites // SliceAI Command Center",
  description: "A premium high-thermal AI calibrator and customer support engine for Urban Crust Pizza shop.",
  keywords: ["Pizza Shop", "SliceAI", "Dough Hydration", "Baking Temperature", "Customer Support Chatbot"],
  authors: [{ name: "DeepMind Advanced Coding Pair" }],
  openGraph: {
    title: "Pizza Bites // SliceAI Command Center",
    description: "Automated support engine and recipe calibrator for Urban Crust Pizza.",
    type: "website",
  }
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      suppressHydrationWarning={true}
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-[#0D0C0A] text-gray-100 selection:bg-amber-500/20 selection:text-amber-500">
        <ChatProvider>
          {children}
          <AuthModal />
          <ProfileModal />
        </ChatProvider>
      </body>
    </html>
  );
}
