"use client";

import { useState } from "react";
import Sidebar from "./Sidebar";
import TopNav from "./TopNav";
import MobileNav from "./MobileNav";

export default function DashboardLayoutClient({
  children,
}: {
  children: React.ReactNode;
}) {
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  return (
    <div className="flex min-h-screen bg-black">
      {/* Sidebar - masaüstünde görünür, mobilde gizli */}
      <Sidebar />

      {/* Ana içerik alanı */}
      <div className="flex-1 flex flex-col min-w-0 md:pl-20 lg:pl-64">
        <TopNav onMenuClick={() => setMobileNavOpen(true)} />
        <main className="flex-1">{children}</main>
      </div>

      {/* Mobil drawer menü */}
      <MobileNav open={mobileNavOpen} onOpenChange={setMobileNavOpen} />
    </div>
  );
}
