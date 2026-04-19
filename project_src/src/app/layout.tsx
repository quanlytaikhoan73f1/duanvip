import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import AppShell from "@/components/layout/AppShell";
import { AppDataProvider } from "@/components/providers/AppDataProvider";
import "./globals.css";

const geistSans = Geist({ variable: "--font-geist-sans", subsets: ["latin"] });
const geistMono = Geist_Mono({ variable: "--font-geist-mono", subsets: ["latin"] });

export const metadata: Metadata = {
  title: "QL Thi Công | Tiến Độ · Dòng Tiền · Nhân Sự",
  description: "Hệ thống quản lý thi công xây dựng: tiến độ công trình, dòng tiền, phân công nhân sự.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="vi">
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
        <AppDataProvider>
          <AppShell>{children}</AppShell>
        </AppDataProvider>
      </body>
    </html>
  );
}
