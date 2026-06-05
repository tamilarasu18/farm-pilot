"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import type { Land, Section } from "@/lib/types";
import SectionCanvas from "@/components/land-editor/SectionCanvas";

export default function MapPage() {
  const [lands, setLands] = useState<Land[]>([]);
  const [activeLandId, setActiveLandId] = useState<string>("");
  const [sections, setSections] = useState<Section[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [selectedSectionId, setSelectedSectionId] = useState<string | null>(null);

  useEffect(() => {
    const fetchLands = async () => {
      try {
        const landsData = await api.getLands();
        setLands(landsData);
        if (landsData.length > 0) {
          setActiveLandId(landsData[0].id);
        }
      } catch {
        setError("Failed to load lands.");
      } finally {
        setIsLoading(false);
      }
    };
    fetchLands();
  }, []);

  useEffect(() => {
    if (!activeLandId) return;
    const fetchSections = async () => {
      try {
        const sectionsData = await api.getSections(activeLandId);
        setSections(sectionsData);
      } catch {
        // ignore
      }
    };
    fetchSections();
  }, [activeLandId]);

  if (isLoading) {
    return (
      <div className="max-w-6xl mx-auto space-y-6">
        <div className="skeleton h-12 w-48" />
        <div className="skeleton h-[600px] w-full rounded-2xl" />
      </div>
    );
  }

  if (error || lands.length === 0) {
    return (
      <div className="p-4 rounded-xl text-center" style={{ background: "rgba(239, 83, 80, 0.1)", color: "var(--color-error)" }}>
        {error || "No lands found. Please create a land in 'My Lands' first."}
      </div>
    );
  }

  const activeLand = lands.find(l => l.id === activeLandId);
  const selectedSection = sections.find(s => s.id === selectedSectionId);

  return (
    <div className="max-w-6xl mx-auto animate-fade-in space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-[var(--foreground)]">Interactive Farm Map</h1>
          <p className="text-sm mt-2" style={{ color: "var(--text-secondary)" }}>
            Visual overview of your land and crops.
          </p>
        </div>
        
        {lands.length > 1 && (
          <select
            className="input-field !w-auto"
            value={activeLandId}
            onChange={(e) => setActiveLandId(e.target.value)}
          >
            {lands.map((l) => (
              <option key={l.id} value={l.id}>{l.name}</option>
            ))}
          </select>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        <div className="lg:col-span-3">
          <div className="card shadow-lg p-2">
            {activeLand && (
              <SectionCanvas
                landBoundary={activeLand.boundary_points || []}
                totalAreaAcres={activeLand.total_area_acres}
                sections={sections}
                selectedSectionId={selectedSectionId}
                onSectionSelect={setSelectedSectionId}
                isDrawing={false}
                drawingPoints={[]}
                onDrawingPointsChange={() => {}}
                onDrawingComplete={() => {}}
              />
            )}
          </div>
        </div>
        
        <div className="lg:col-span-1 space-y-4">
          <div className="card sticky top-6">
            <h3 className="font-bold text-lg mb-4 text-[var(--foreground)]">Section Details</h3>
            
            {!selectedSection ? (
              <div className="text-sm text-center py-8" style={{ color: "var(--text-muted)" }}>
                Click on a section on the map to view its details.
              </div>
            ) : (
              <div className="space-y-4 animate-fade-in">
                <div className="flex items-center gap-3 pb-4" style={{ borderBottom: "1px dashed var(--border)" }}>
                  <div className="w-4 h-4 rounded-full shadow-inner" style={{ background: selectedSection.color }} />
                  <span className="font-bold text-lg text-[var(--foreground)]">{selectedSection.name}</span>
                </div>
                
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span style={{ color: "var(--text-secondary)" }}>Area:</span>
                    <span className="font-semibold text-[var(--foreground)]">{selectedSection.area_acres} acres</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span style={{ color: "var(--text-secondary)" }}>Crop:</span>
                    <span className="font-semibold text-[var(--foreground)] flex items-center gap-1">
                      {selectedSection.crop_emoji || "🌱"} {selectedSection.crop_name || "None"}
                    </span>
                  </div>
                </div>

                <div className="pt-4" style={{ borderTop: "1px solid var(--border)" }}>
                  <a href={`/logs?section=${selectedSection.id}`} className="btn btn-secondary w-full text-sm">
                    View Daily Logs
                  </a>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
