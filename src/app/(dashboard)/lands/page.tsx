"use client";

import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { api } from "@/lib/api";

export default function LandsPage() {
  const { data: lands = [], isLoading } = useQuery({
    queryKey: ["lands"],
    queryFn: () => api.getLands(),
  });

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
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5 stagger">
          {lands.map((land) => (
            <Link
              key={land.id}
              href={`/lands/${land.id}`}
              className="card card-interactive group flex flex-row gap-5 items-center p-4 transition-all hover:shadow-lg"
            >
              {/* Compact Preview thumbnail on the left */}
              <div
                className="w-24 h-24 shrink-0 rounded-2xl flex items-center justify-center overflow-hidden border transition-transform group-hover:scale-[1.02]"
                style={{
                  background:
                    "linear-gradient(135deg, rgba(64,145,108,0.1), rgba(212,163,115,0.05))",
                  borderColor: "rgba(64,145,108,0.2)"
                }}
              >
                {land.boundary_points && land.boundary_points.length > 0 ? (
                  <svg
                    viewBox="0 0 200 120"
                    className="w-full h-full p-2 opacity-80 group-hover:opacity-100 transition-opacity"
                  >
                    <polygon
                      points={land.boundary_points
                        .map((p) => `${p.x * 1.5},${p.y * 1.5}`)
                        .join(" ")}
                      fill="rgba(64,145,108,0.4)"
                      stroke="rgba(64,145,108,1)"
                      strokeWidth="3"
                    />
                  </svg>
                ) : (
                  <span className="text-3xl opacity-60 group-hover:scale-110 transition-transform">
                    🌾
                  </span>
                )}
              </div>

              {/* Dense Info on the right */}
              <div className="flex-1 min-w-0 py-1">
                <div className="flex justify-between items-start mb-2 gap-2">
                  <h3 className="font-bold text-lg text-[var(--foreground)] truncate group-hover:text-[var(--color-primary)] transition-colors leading-tight">
                    {land.name}
                  </h3>
                  {land.total_area_acres && (
                    <span className="badge shrink-0" style={{ background: "var(--color-primary)", color: "white", fontWeight: "bold" }}>
                      {land.total_area_acres} ac
                    </span>
                  )}
                </div>

                <div className="flex flex-col gap-1.5 text-sm" style={{ color: "var(--text-secondary)" }}>
                  <div className="flex items-center gap-2">
                    <span className="opacity-60 text-xs">🧩</span>
                    <span className="font-medium">{land.sections_count} section{land.sections_count !== 1 ? "s" : ""}</span>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <span className="opacity-60 text-xs">📍</span>
                    <span className="truncate">{land.address || "No address provided"}</span>
                  </div>
                </div>
              </div>
              
              {/* Arrow Icon Indicator */}
              <div className="shrink-0 opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all text-[var(--color-primary)] pr-2">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M5 12h14M12 5l7 7-7 7"/>
                </svg>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
