"use client";

import { BarChart3 } from "lucide-react";

export default function StatsPage() {
  return (
    <div className="min-h-screen p-4 sm:p-6 pb-24">
      <div className="max-w-4xl mx-auto">
        <header className="mb-6">
          <h1 className="text-2xl md:text-3xl font-bold">İstatistikler</h1>
          <p className="text-muted-foreground">
            Öğrenme ilerlemenizi takip edin
          </p>
        </header>

        <div className="flex flex-col items-center justify-center py-16 px-6 rounded-xl border border-dashed bg-muted/30">
          <BarChart3 className="w-16 h-16 text-muted-foreground mb-4" />
          <h3 className="text-lg font-semibold mb-2">Yakında</h3>
          <p className="text-muted-foreground text-center">
            İstatistik özelliği yakında eklenecek.
          </p>
        </div>
      </div>
    </div>
  );
}
