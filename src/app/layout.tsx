import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Toaster } from "sonner";
import AuthProvider from "@/components/auth/AuthProvider";
import Sidebar from "@/components/layout/Sidebar";
import { PWAInstallPrompt } from "@/features/pwa/components/PWAInstallPrompt";
import { ReadingReminderToast } from "@/features/pwa/components/ReadingReminderToast";

const inter = Inter({ subsets: ["latin"] });

export const viewport: Viewport = {
  themeColor: "#050505",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export const metadata: Metadata = {
  title: "NeuroRead | Hızlı Okuma Asistanı",
  description: "DEHB ve Disleksi dostu, oyunlaştırılmış okuma deneyimi.",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "NeuroRead",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="tr">
      <body className={inter.className}>
        {/* AuthProvider tüm uygulamayı sarmalı */}
        <AuthProvider>
          <div className="flex min-h-screen bg-black">
            {/* Sidebar'ı sadece giriş yapıldığında göstermek idealdir ama şimdilik burada kalsın */}
             <Sidebar /> 
            
            <main className="flex-1">
              {children}
            </main>
          </div>
          <Toaster position="top-center" theme="dark" />
          <PWAInstallPrompt />
          <ReadingReminderToast />
        </AuthProvider>
      </body>
    </html>
  );
}