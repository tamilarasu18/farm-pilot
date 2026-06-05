"use client";

import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { api } from "@/lib/api";
import type { Crop } from "@/lib/types";

interface ActiveCropSummary {
  crop: Crop;
  totalAcres: number;
  sectionsCount: number;
}

export default function CropsPage() {
  const { data, isLoading, error } = useQuery({
    queryKey: ["crops_and_summaries"],
    queryFn: async () => {
      // 1. Fetch Crop Catalog
      const cropsData = await api.getCrops();

      // 2. Fetch Active Crops (Lands -> Sections)
      const landsData = await api.getLands();
      const summaryMap = new Map<string, { totalAcres: number; count: number }>();
      
      for (const land of landsData) {
        const sections = await api.getSections(land.id);
        sections.forEach(sec => {
          if (sec.current_crop_id) {
            const current = summaryMap.get(sec.current_crop_id) || { totalAcres: 0, count: 0 };
            summaryMap.set(sec.current_crop_id, {
              totalAcres: current.totalAcres + (sec.area_acres || 0),
              count: current.count + 1
            });
          }
        });
      }

      // Map back to summaries
      const summaries: ActiveCropSummary[] = [];
      summaryMap.forEach((stats, cropId) => {
        const crop = cropsData.find(c => c.id === cropId);
        if (crop) {
          summaries.push({
            crop,
            totalAcres: stats.totalAcres,
            sectionsCount: stats.count
          });
        }
      });

      // Sort by acreage
      summaries.sort((a, b) => b.totalAcres - a.totalAcres);
      
      return { crops: cropsData, summaries };
    }
  });

  const crops = data?.crops || [];
  const activeSummaries = data?.summaries || [];



  if (isLoading) {
    return (
      <div className="max-w-6xl mx-auto space-y-6">
        <div className="skeleton h-12 w-48" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="skeleton h-32 w-full rounded-2xl" />
          <div className="skeleton h-32 w-full rounded-2xl" />
          <div className="skeleton h-32 w-full rounded-2xl" />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 rounded-xl text-center" style={{ background: "rgba(239, 83, 80, 0.1)", color: "var(--color-error)" }}>
        {error instanceof Error ? error.message : "Failed to load crop data."}
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto animate-fade-in space-y-10">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-[var(--foreground)]">Crops Overview</h1>
          <p className="text-sm mt-2" style={{ color: "var(--text-secondary)" }}>
            Track currently growing crops and explore the global catalog.
          </p>
        </div>
        <Link href="/crops/new" className="btn btn-primary">
          + Add Custom Crop
        </Link>
      </div>

      {/* Active Crops Summary */}
      <section>
        <h2 className="text-xl font-bold mb-4 text-[var(--foreground)] flex items-center gap-2">
          <span>🚜</span> Currently Growing
        </h2>
        {activeSummaries.length === 0 ? (
          <div className="card text-center py-12 border-dashed border-2 text-sm text-[var(--text-muted)]">
            You don't have any crops currently planted in your sections.<br/>
            Go to <strong>My Lands</strong> to assign crops to sections.
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {activeSummaries.map((summary) => (
              <div key={summary.crop.id} className="card shadow-md flex items-center gap-4">
                <div className="w-16 h-16 rounded-full flex items-center justify-center text-3xl shadow-inner" style={{ background: "var(--background)", border: "2px solid var(--border)" }}>
                  {summary.crop.icon_emoji}
                </div>
                <div>
                  <h3 className="font-bold text-lg text-[var(--foreground)]">{summary.crop.name}</h3>
                  <p className="text-xs text-[var(--text-secondary)] font-semibold mt-1">
                    {summary.totalAcres.toFixed(1)} Acres
                  </p>
                  <p className="text-xs text-[var(--text-muted)]">
                    Across {summary.sectionsCount} section{summary.sectionsCount !== 1 && "s"}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Crop Reference Catalog */}
      <section>
        <h2 className="text-xl font-bold mb-4 text-[var(--foreground)] flex items-center gap-2 pt-6" style={{ borderTop: "1px dashed var(--border)" }}>
          <span>📚</span> Global Crop Catalog
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {crops.map((crop) => (
            <div key={crop.id} className="card p-4 flex flex-col hover:shadow-lg transition-all border border-[var(--border)] hover:border-[var(--color-primary)]">
              <div className="flex items-center gap-3 mb-3">
                <span className="text-2xl">{crop.icon_emoji}</span>
                <div>
                  <h4 className="font-bold text-[var(--foreground)]">{crop.name}</h4>
                  {crop.variety && (
                    <span className="text-xs text-[var(--text-secondary)] bg-[var(--background)] px-2 py-0.5 rounded-full">
                      {crop.variety}
                    </span>
                  )}
                </div>
              </div>
              <div className="space-y-1 text-sm mt-auto">
                <div className="flex justify-between">
                  <span className="text-[var(--text-muted)]">Season:</span>
                  <span className="font-medium text-[var(--foreground)]">{crop.season || "Any"}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[var(--text-muted)]">Duration:</span>
                  <span className="font-medium text-[var(--foreground)]">
                    {crop.growth_duration_days ? `${crop.growth_duration_days} days` : "Unknown"}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>


    </div>
  );
}
