"use client";

import { usePathname } from "next/navigation";
import Sidebar from "@/components/layout/Sidebar";
import BottomNav from "@/components/layout/BottomNav";
import CommandMenu from "@/components/shared/CommandMenu";
import OfflineIndicator from "@/components/OfflineIndicator";

export default function ClientLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  
  // Public sayfalar (Sidebar gösterilmeyecek)
  const publicPages = [
    "/login",
    "/register",
    "/signup",
    "/auth/login",
    "/auth/register",
    "/auth/callback",
  ];
  
  const isPublicPage = publicPages.includes(pathname);

  // Public sayfalarda sadece children (Toaster + SyncManager RootLayout'ta)
  if (isPublicPage) {
    return (
      <>
        <OfflineIndicator />
        {children}
      </>
    );
  }

  // İç sayfalarda tam layout
  return (
    <>
      <OfflineIndicator />
      <div className="flex h-screen bg-black text-white">
        {/* Desktop Sidebar */}
        <Sidebar />
        
        {/* Ana İçerik */}
        <main className="flex-1 overflow-y-auto p-8 relative md:ml-64 pb-20 md:pb-8">
          {children}
        </main>
      </div>
      
      {/* Mobil Alt Navigasyon */}
      <BottomNav />
      <CommandMenu />
    </>
  );
}
