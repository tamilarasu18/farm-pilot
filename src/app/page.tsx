"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";

export default function HomePage() {
  const router = useRouter();
  const { isAuthenticated, isLoading } = useAuth();

  useEffect(() => {
    if (!isLoading) {
      if (isAuthenticated) {
        router.replace("/lands");
      } else {
        router.replace("/login");
      }
    }
  }, [isAuthenticated, isLoading, router]);

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center animate-fade-in">
        <div
          className="inline-flex items-center justify-center w-20 h-20 rounded-2xl mb-4 animate-pulse-glow"
          style={{
            background:
              "linear-gradient(135deg, var(--color-primary), var(--color-primary-light))",
          }}
        >
          <span className="text-4xl">🌱</span>
        </div>
        <h1 className="text-xl font-semibold" style={{ color: "var(--text-secondary)" }}>
          Loading FarmPilot...
        </h1>
      </div>
    </div>
  );
}
