"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Sidebar from "./Sidebar";
import TopNav from "./TopNav";
import MobileNav from "./MobileNav";
import { useAuth } from "@/contexts/AuthContext";

export default function DashboardLayoutClient({
  children,
}: {
  children: React.ReactNode;
}) {
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (loading) return;
    if (!user) {
      router.replace("/login");
    }
  }, [user, loading, router]);

  if (!loading && !user) {
    return null;
  }

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
