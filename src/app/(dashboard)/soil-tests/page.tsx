"use client";

import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { api } from "@/lib/api";

export default function SoilTestsPage() {
  const { data: tests = [], isLoading } = useQuery({
    queryKey: ["soil-tests"],
    queryFn: () => api.getAllSoilTests(),
  });

  const { data: lands = [] } = useQuery({
    queryKey: ["lands"],
    queryFn: () => api.getLands(),
  });

  const getStatusColor = (ph: number | null) => {
    if (!ph) return "var(--text-muted)";
    if (ph >= 6.0 && ph <= 7.5) return "var(--color-success)";
    if (ph < 5.5 || ph > 8.0) return "var(--color-error)";
    return "var(--color-warning)";
  };

  return (
    <div className="animate-fade-in">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-bold text-[var(--foreground)]">
            Soil Health
          </h1>
          <p className="text-sm mt-1" style={{ color: "var(--text-secondary)" }}>
            Monitor and track your soil test reports over time
          </p>
        </div>
        <Link href="/soil-tests/new" className="btn btn-primary" id="add-soil-test-btn">
          + New Soil Test
        </Link>
      </div>

      {/* Skeleton Loading State */}
      {isLoading && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {[1, 2, 3].map((i) => (
            <div key={i} className="card p-5">
              <div className="skeleton h-6 w-32 mb-4" />
              <div className="skeleton h-4 w-48 mb-6" />
              <div className="grid grid-cols-2 gap-4">
                <div className="skeleton h-12 w-full rounded-lg" />
                <div className="skeleton h-12 w-full rounded-lg" />
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Empty State */}
      {!isLoading && tests.length === 0 && (
        <div className="text-center py-20">
          <div className="text-6xl mb-4">🧪</div>
          <h2 className="text-xl font-semibold text-[var(--foreground)] mb-2">
            No soil tests recorded
          </h2>
          <p className="text-sm mb-6" style={{ color: "var(--text-muted)" }}>
            Keep track of your soil health to optimize fertilizer usage
          </p>
          <Link href="/soil-tests/new" className="btn btn-primary">
            Record First Test
          </Link>
        </div>
      )}

      {/* Tests Grid */}
      {!isLoading && tests.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 stagger">
          {tests.map((test) => {
            const land = lands.find((l) => l.id === test.land_id);
            return (
              <div key={test.id} className="card flex flex-col h-full">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="font-bold text-lg text-[var(--foreground)]">
                      {land ? land.name : "Unknown Land"}
                    </h3>
                    <p className="text-sm" style={{ color: "var(--text-muted)" }}>
                      {new Date(test.test_date).toLocaleDateString("en-US", {
                        year: "numeric", month: "short", day: "numeric"
                      })}
                    </p>
                  </div>
                  <div className="w-10 h-10 rounded-full flex items-center justify-center text-xl" style={{ background: "var(--surface-light)" }}>
                    🧪
                  </div>
                </div>

                {test.lab_name && (
                  <p className="text-sm mb-4" style={{ color: "var(--text-secondary)" }}>
                    <span className="font-medium">Lab:</span> {test.lab_name}
                  </p>
                )}

                <div className="grid grid-cols-2 gap-3 mb-4 mt-auto">
                  <div className="p-3 rounded-xl text-center" style={{ background: "rgba(64, 145, 108, 0.05)", border: "1px solid rgba(64, 145, 108, 0.1)" }}>
                    <div className="text-xs font-semibold mb-1" style={{ color: "var(--text-secondary)" }}>pH Level</div>
                    <div className="text-xl font-bold" style={{ color: getStatusColor(test.ph_level) }}>
                      {test.ph_level ? test.ph_level.toFixed(1) : "—"}
                    </div>
                  </div>
                  <div className="p-3 rounded-xl text-center" style={{ background: "rgba(212, 163, 115, 0.05)", border: "1px solid rgba(212, 163, 115, 0.1)" }}>
                    <div className="text-xs font-semibold mb-1" style={{ color: "var(--text-secondary)" }}>Org. Carbon</div>
                    <div className="text-xl font-bold text-[var(--foreground)]">
                      {test.organic_carbon ? `${test.organic_carbon}%` : "—"}
                    </div>
                  </div>
                </div>

                <div className="flex gap-2 justify-center text-sm font-mono p-2 rounded-lg" style={{ background: "var(--surface-light)" }}>
                  <span className="text-blue-600 font-bold" title="Nitrogen">N: {test.nitrogen || "-"}</span>
                  <span className="text-red-500 font-bold" title="Phosphorus">P: {test.phosphorus || "-"}</span>
                  <span className="text-yellow-600 font-bold" title="Potassium">K: {test.potassium || "-"}</span>
                  <span className="text-xs self-center" style={{ color: "var(--text-muted)" }}>{test.measurement_unit}</span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
