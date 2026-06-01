"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { api } from "@/lib/api";
import type { Land } from "@/lib/types";

export default function LandsPage() {
  const [lands, setLands] = useState<Land[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    api
      .getLands()
      .then(setLands)
      .catch(() => {})
      .finally(() => setIsLoading(false));
  }, []);

  return (
    <div className="animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-[var(--foreground)]">
            My Lands
          </h1>
          <p className="text-sm mt-1" style={{ color: "var(--text-secondary)" }}>
            Manage your farm parcels and sections
          </p>
        </div>
        <Link href="/lands/new" className="btn btn-primary" id="add-land-btn">
          <svg
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
          >
            <path d="M12 5v14M5 12h14" />
          </svg>
          Add Land
        </Link>
      </div>

      {/* Loading */}
      {isLoading && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="card" style={{ minHeight: "180px" }}>
              <div className="skeleton h-5 w-32 mb-3" />
              <div className="skeleton h-4 w-48 mb-2" />
              <div className="skeleton h-4 w-24" />
            </div>
          ))}
        </div>
      )}

      {/* Empty State */}
      {!isLoading && lands.length === 0 && (
        <div className="text-center py-20">
          <div className="text-6xl mb-4">🗺️</div>
          <h2 className="text-xl font-semibold text-[var(--foreground)] mb-2">
            No lands yet
          </h2>
          <p className="text-sm mb-6" style={{ color: "var(--text-muted)" }}>
            Add your first land parcel to start managing your farm
          </p>
          <Link href="/lands/new" className="btn btn-primary">
            Add Your First Land
          </Link>
        </div>
      )}

      {/* Lands Grid */}
      {!isLoading && lands.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 stagger">
          {lands.map((land) => (
            <Link
              key={land.id}
              href={`/lands/${land.id}`}
              className="card card-interactive group"
            >
              {/* Preview thumbnail */}
              <div
                className="w-full h-32 rounded-lg mb-4 flex items-center justify-center overflow-hidden"
                style={{
                  background:
                    "linear-gradient(135deg, var(--color-primary-dark), var(--surface-light))",
                }}
              >
                {land.boundary_points && land.boundary_points.length > 0 ? (
                  <svg
                    viewBox="0 0 200 120"
                    className="w-full h-full"
                    style={{ padding: "16px" }}
                  >
                    <polygon
                      points={land.boundary_points
                        .map((p) => `${p.x * 1.5},${p.y * 1.5}`)
                        .join(" ")}
                      fill="rgba(64,145,108,0.3)"
                      stroke="rgba(64,145,108,0.8)"
                      strokeWidth="2"
                    />
                  </svg>
                ) : (
                  <span className="text-4xl opacity-50 group-hover:scale-110 transition-transform">
                    🌾
                  </span>
                )}
              </div>

              {/* Info */}
              <h3 className="font-semibold text-[var(--foreground)] mb-1 group-hover:text-[var(--color-primary-light)] transition-colors">
                {land.name}
              </h3>
              <div
                className="flex items-center gap-3 text-xs"
                style={{ color: "var(--text-muted)" }}
              >
                {land.total_area_acres && (
                  <span className="badge">{land.total_area_acres} acres</span>
                )}
                <span className="badge">
                  {land.sections_count} section
                  {land.sections_count !== 1 ? "s" : ""}
                </span>
              </div>
              {land.address && (
                <p
                  className="text-xs mt-2 truncate"
                  style={{ color: "var(--text-muted)" }}
                >
                  📍 {land.address}
                </p>
              )}
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
