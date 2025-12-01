import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { ConditionalLayout } from "@/components/conditional-layout";
import { Toaster } from "sonner";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

export const metadata: Metadata = {
  title: "GroomIQ - Pet Grooming CRM",
  description: "Simple, clean CRM for pet groomers",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${inter.variable} font-sans antialiased`}>
        <ConditionalLayout>{children}</ConditionalLayout>
        <Toaster richColors position="top-right" />
      </body>
    </html>
  );
}
