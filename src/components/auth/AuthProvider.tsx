"use client";

import { useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { useNeuroStore } from "@/store/useNeuroStore";
import { useRouter, usePathname } from "next/navigation";

export default function AuthProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const setUser = useNeuroStore((state) => state.setUser);

  useEffect(() => {
    const supabase = createClient();

    const checkUser = async () => {
      const { data: { session } } = await supabase.auth.getSession();

      if (session?.user) {
        setUser({
          id: session.user.id,
          email: session.user.email || "",
          name: (session.user.user_metadata?.username as string) || "Kaptan",
          avatar: null,
        });
      } else {
        setUser(null);
      }
    };

    checkUser();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        setUser({
          id: session.user.id,
          email: session.user.email || "",
          name: (session.user.user_metadata?.username as string) || "Kaptan",
          avatar: null,
        });
        if (pathname === "/auth/login" || pathname === "/auth/register") {
          router.push("/dashboard");
        }
      } else {
        setUser(null);
        if (pathname === "/dashboard" || pathname === "/library") {
          router.push("/login");
        }
      }
    });

    return () => subscription.unsubscribe();
  }, [pathname, router, setUser]);

  return <>{children}</>;
}
