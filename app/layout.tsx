import { SidebarProvider } from "@/components/ui/sidebar";
import { Toaster } from "@/components/ui/toaster";
import { Inter } from "next/font/google";
import type React from "react"; // Added import for React
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

export const metadata = {
  title: "MintAI",
  description: "Chat with AI and mint generated images on the SUI blockchain",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <SidebarProvider>{children}</SidebarProvider>
        <Toaster />
      </body>
    </html>
  );
}
