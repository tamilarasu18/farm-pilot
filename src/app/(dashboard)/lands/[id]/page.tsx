"use client";

import { useEffect, useState, use } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api";
import type { Land, Section, Crop, Point } from "@/lib/types";
import LandCanvas from "@/components/land-editor/LandCanvas";
import SectionCanvas from "@/components/land-editor/SectionCanvas";

const SECTION_COLORS = [
  "#40916C", "#D4A373", "#42A5F5", "#FFB74D", "#EF5350",
  "#AB47BC", "#26A69A", "#FFA726", "#7E57C2", "#66BB6A",
];

export default function LandDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const [land, setLand] = useState<Land | null>(null);
  const [sections, setSections] = useState<Section[]>([]);
  const [crops, setCrops] = useState<Crop[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [boundaryPoints, setBoundaryPoints] = useState<Point[]>([]);
  const [activeTab, setActiveTab] = useState<"draw" | "sections">("draw");

  // Edit/Lock mode: false = locked (readonly), true = editing
  const [isEditing, setIsEditing] = useState(false);
  // Track whether boundary has been saved (exists on server)
  const [hasSavedBoundary, setHasSavedBoundary] = useState(false);

  // Section drawing state
  const [isDrawingSection, setIsDrawingSection] = useState(false);
  const [drawingPoints, setDrawingPoints] = useState<{ x: number; y: number }[]>([]);
  const [selectedSectionId, setSelectedSectionId] = useState<string | null>(null);
  const [redrawingSectionId, setRedrawingSectionId] = useState<string | null>(null);

  // Quick-add section form (no drawing)
  const [showQuickAdd, setShowQuickAdd] = useState(false);
  const [quickAddName, setQuickAddName] = useState("");
  const [quickAddCrop, setQuickAddCrop] = useState("");

  // New section form (shown after drawing completes)
  const [showNewSectionForm, setShowNewSectionForm] = useState(false);
  const [pendingSectionPoints, setPendingSectionPoints] = useState<{ x: number; y: number }[]>([]);
  const [pendingSectionAcres, setPendingSectionAcres] = useState<number | null>(null);
  const [newSectionName, setNewSectionName] = useState("");
  const [newSectionCrop, setNewSectionCrop] = useState("");
  const [saveMessage, setSaveMessage] = useState("");

  useEffect(() => {
    Promise.all([api.getLand(id), api.getSections(id), api.getCrops()])
      .then(([landData, sectionsData, cropsData]) => {
        setLand(landData);
        setSections(sectionsData);
        setCrops(cropsData);
        setBoundaryPoints(landData.boundary_points || []);

        const hasBoundary =
          landData.boundary_points != null &&
          landData.boundary_points.length >= 3;
        setHasSavedBoundary(hasBoundary);
        // Start in editing mode only if no boundary exists yet
        setIsEditing(!hasBoundary);
      })
      .catch(() => router.push("/lands"))
      .finally(() => setIsLoading(false));
  }, [id, router]);

  const handleSaveBoundary = async () => {
    if (!land) return;
    if (boundaryPoints.length < 3) {
      setSaveMessage("Draw at least 3 vertices to form a boundary");
      setTimeout(() => setSaveMessage(""), 3000);
      return;
    }

    setIsSaving(true);
    setSaveMessage("");
    try {
      // Count how many points have custom curves
      const curvedCount = boundaryPoints.filter(
        (p) => p.curve != null && p.curve > 0
      ).length;

      const updated = await api.updateLand(land.id, {
        boundary_points: boundaryPoints,
        canvas_metadata: {
          total_vertices: boundaryPoints.length,
          curved_vertices: curvedCount,
          saved_at: new Date().toISOString(),
        },
      });
      setLand(updated);
      setHasSavedBoundary(true);
      setIsEditing(false); // Lock after save
      const curveInfo =
        curvedCount > 0
          ? ` (${curvedCount} curved corner${curvedCount > 1 ? "s" : ""})`
          : "";
      setSaveMessage(
        `Boundary saved successfully! ${boundaryPoints.length} points${curveInfo}`
      );
      setTimeout(() => setSaveMessage(""), 4000);
    } catch {
      setSaveMessage("Failed to save boundary");
      setTimeout(() => setSaveMessage(""), 3000);
    } finally {
      setIsSaving(false);
    }
  };

  const handleEditBoundary = () => {
    setIsEditing(true);
    setActiveTab("draw");
  };

  const handleCancelEdit = () => {
    // Revert to saved boundary
    if (land?.boundary_points) {
      setBoundaryPoints(land.boundary_points);
    }
    setIsEditing(false);
  };

  // ── Section drawing flow ──

  const handleStartDrawSection = () => {
    setIsDrawingSection(true);
    setDrawingPoints([]);
    setSelectedSectionId(null);
    setRedrawingSectionId(null);
  };

  const handleStartRedrawSection = (sectionId: string) => {
    setIsDrawingSection(true);
    setDrawingPoints([]);
    setRedrawingSectionId(sectionId);
    setSelectedSectionId(null);
  };

  const handleCancelDrawing = () => {
    setIsDrawingSection(false);
    setDrawingPoints([]);
    setRedrawingSectionId(null);
  };

  const handleDrawingComplete = (
    points: { x: number; y: number }[],
    areaAcres: number | null
  ) => {
    if (points.length < 3) return;

    if (redrawingSectionId) {
      // Redrawing an existing section — update directly
      handleUpdateSectionBoundary(redrawingSectionId, points, areaAcres);
      setIsDrawingSection(false);
      setDrawingPoints([]);
      setRedrawingSectionId(null);
    } else {
      // New section — show the name/crop form
      setPendingSectionPoints(points);
      setPendingSectionAcres(areaAcres);
      setShowNewSectionForm(true);
      setIsDrawingSection(false);
      setDrawingPoints([]);
    }
  };

  const handleConfirmNewSection = async () => {
    if (!newSectionName.trim() || pendingSectionPoints.length < 3) return;
    try {
      const section = await api.createSection(id, {
        name: newSectionName,
        color: SECTION_COLORS[sections.length % SECTION_COLORS.length],
        current_crop_id: newSectionCrop || undefined,
        boundary_points: pendingSectionPoints.map((p) => ({
          x: p.x,
          y: p.y,
        })),
        area_acres: pendingSectionAcres ?? undefined,
      });
      setSections([...sections, section]);
      setNewSectionName("");
      setNewSectionCrop("");
      setShowNewSectionForm(false);
      setPendingSectionPoints([]);
      setPendingSectionAcres(null);
      setSaveMessage("Section created successfully!");
      setTimeout(() => setSaveMessage(""), 3000);
    } catch {
      setSaveMessage("Failed to create section");
      setTimeout(() => setSaveMessage(""), 3000);
    }
  };

  const handleCancelNewSection = () => {
    setShowNewSectionForm(false);
    setPendingSectionPoints([]);
    setPendingSectionAcres(null);
    setNewSectionName("");
    setNewSectionCrop("");
  };

  const handleUpdateSectionBoundary = async (
    sectionId: string,
    points: { x: number; y: number }[],
    areaAcres: number | null
  ) => {
    try {
      const updated = await api.updateSection(sectionId, {
        boundary_points: points.map((p) => ({ x: p.x, y: p.y })),
        area_acres: areaAcres ?? undefined,
      });
      setSections(sections.map((s) => (s.id === sectionId ? updated : s)));
      setSaveMessage("Section boundary updated!");
      setTimeout(() => setSaveMessage(""), 3000);
    } catch {
      setSaveMessage("Failed to update section");
      setTimeout(() => setSaveMessage(""), 3000);
    }
  };

  const handleDeleteSection = async (sectionId: string) => {
    try {
      await api.deleteSection(sectionId);
      setSections(sections.filter((s) => s.id !== sectionId));
      if (selectedSectionId === sectionId) setSelectedSectionId(null);
    } catch {
      // handle error
    }
  };

  const handleUpdateSectionCrop = async (sectionId: string, cropId: string) => {
    try {
      const updated = await api.updateSection(sectionId, {
        current_crop_id: cropId || undefined,
      });
      setSections(sections.map((s) => (s.id === sectionId ? updated : s)));
    } catch {
      // handle error
    }
  };

  const handleClearSectionShape = async (sectionId: string) => {
    try {
      const updated = await api.updateSection(sectionId, {
        boundary_points: [] as any,
        area_acres: null as any,
      });
      setSections(sections.map((s) => (s.id === sectionId ? updated : s)));
      setSaveMessage("Section shape cleared!");
      setTimeout(() => setSaveMessage(""), 3000);
      if (selectedSectionId === sectionId) {
        setSelectedSectionId(null);
      }
    } catch {
      setSaveMessage("Failed to clear section shape");
      setTimeout(() => setSaveMessage(""), 3000);
    }
  };

  const handleQuickAddSection = async () => {
    if (!quickAddName.trim()) return;
    try {
      const section = await api.createSection(id, {
        name: quickAddName,
        color: SECTION_COLORS[sections.length % SECTION_COLORS.length],
        current_crop_id: quickAddCrop || undefined,
      });
      setSections([...sections, section]);
      setQuickAddName("");
      setQuickAddCrop("");
      setShowQuickAdd(false);
      setSaveMessage("Section created! You can draw its shape later.");
      setTimeout(() => setSaveMessage(""), 3000);
    } catch {
      setSaveMessage("Failed to create section");
      setTimeout(() => setSaveMessage(""), 3000);
    }
  };

  if (isLoading) {
    return (
      <div className="animate-fade-in">
        <div className="skeleton h-8 w-48 mb-4" />
        <div className="skeleton h-[400px] w-full rounded-xl" />
      </div>
    );
  }

  if (!land) return null;

  return (
    <div className="animate-fade-in">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
        <div>
          <button
            onClick={() => router.push("/lands")}
            className="btn btn-ghost btn-sm mb-2"
            style={{ color: "var(--text-secondary)" }}
          >
            ← Back to Lands
          </button>
          <h1 className="text-2xl font-bold text-[var(--foreground)]">
            {land.name}
          </h1>
          <div className="flex items-center gap-3 mt-1">
            {land.address && (
              <p
                className="text-sm"
                style={{ color: "var(--text-muted)" }}
              >
                📍 {land.address}
              </p>
            )}
            {land.total_area_acres && (
              <span className="badge">{land.total_area_acres} acres</span>
            )}
          </div>
        </div>
        <div className="flex gap-2">
          {activeTab === "draw" && (
            <>
              {isEditing ? (
                <>
                  <button
                    onClick={handleSaveBoundary}
                    disabled={isSaving}
                    className="btn btn-primary"
                    id="save-boundary-btn"
                  >
                    {isSaving ? "Saving..." : "💾 Save Boundary"}
                  </button>
                  {hasSavedBoundary && (
                    <button
                      onClick={handleCancelEdit}
                      className="btn btn-secondary"
                      id="cancel-edit-btn"
                    >
                      Cancel
                    </button>
                  )}
                </>
              ) : (
                <button
                  onClick={handleEditBoundary}
                  className="btn btn-secondary"
                  id="edit-boundary-btn"
                >
                  ✏️ Edit Boundary
                </button>
              )}
            </>
          )}
          {activeTab === "sections" && hasSavedBoundary && !isDrawingSection && !showNewSectionForm && !showQuickAdd && (
            <div className="flex gap-2">
              <button
                onClick={handleStartDrawSection}
                className="btn btn-primary"
                id="draw-section-btn"
              >
                ✏️ Draw Section
              </button>
              <button
                onClick={() => setShowQuickAdd(true)}
                className="btn btn-secondary"
                id="add-section-btn"
              >
                + Create Section
              </button>
            </div>
          )}
          {activeTab === "sections" && isDrawingSection && (
            <button
              onClick={handleCancelDrawing}
              className="btn btn-secondary"
              id="cancel-drawing-btn"
            >
              Cancel Drawing
            </button>
          )}
        </div>
      </div>

      {/* Save message */}
      {saveMessage && (
        <div
          className="mb-4 p-3 rounded-lg text-sm animate-fade-in"
          style={{
            background: saveMessage.includes("success") || saveMessage.includes("updated")
              ? "rgba(102, 187, 106, 0.1)"
              : "rgba(239, 83, 80, 0.1)",
            border: saveMessage.includes("success") || saveMessage.includes("updated")
              ? "1px solid rgba(102, 187, 106, 0.3)"
              : "1px solid rgba(239, 83, 80, 0.3)",
            color: saveMessage.includes("success") || saveMessage.includes("updated")
              ? "var(--color-success)"
              : "var(--color-error)",
          }}
        >
          {saveMessage}
        </div>
      )}

      {/* Tabs */}
      <div
        className="flex gap-1 mb-6 p-1 rounded-xl w-fit"
        style={{
          background: "var(--color-surface)",
          border: "1px solid var(--border)",
        }}
      >
        {(["draw", "sections"] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => {
              setActiveTab(tab);
              if (tab !== "sections") {
                setIsDrawingSection(false);
                setDrawingPoints([]);
              }
            }}
            className={`btn btn-sm ${
              activeTab === tab ? "btn-primary" : "btn-ghost"
            }`}
          >
            {tab === "draw"
              ? isEditing
                ? "✏️ Draw Boundary"
                : "🗺️ View Boundary"
              : `🧩 Sections (${sections.length})`}
          </button>
        ))}
      </div>

      {/* Draw Tab */}
      {activeTab === "draw" && (
        <LandCanvas
          initialPoints={boundaryPoints}
          onPointsChange={setBoundaryPoints}
          readonly={!isEditing}
        />
      )}

      {/* Sections Tab */}
      {activeTab === "sections" && (
        <div className="space-y-4">
          {/* Gate: must save boundary first */}
          {!hasSavedBoundary ? (
            <div
              className="text-center py-16 rounded-xl"
              style={{
                background: "var(--color-surface)",
                border: "1px solid var(--border)",
              }}
            >
              <div className="text-5xl mb-4">✏️</div>
              <h2 className="text-lg font-semibold text-[var(--foreground)] mb-2">
                Draw & save your boundary first
              </h2>
              <p
                className="text-sm mb-6 max-w-md mx-auto"
                style={{ color: "var(--text-muted)" }}
              >
                You need to draw at least 3 vertices and save the boundary
                before you can split it into sections.
              </p>
              <button
                onClick={() => {
                  setActiveTab("draw");
                  setIsEditing(true);
                }}
                className="btn btn-primary"
              >
                Go to Draw Boundary
              </button>
            </div>
          ) : (
            <>
              {/* Section Canvas */}
              <SectionCanvas
                landBoundary={boundaryPoints}
                totalAreaAcres={land.total_area_acres}
                sections={sections}
                selectedSectionId={selectedSectionId}
                onSectionSelect={setSelectedSectionId}
                isDrawing={isDrawingSection}
                drawingPoints={drawingPoints}
                onDrawingPointsChange={setDrawingPoints}
                onDrawingComplete={handleDrawingComplete}
              />

              {/* New Section Form (shown after drawing is done) */}
              {showNewSectionForm && (
                <div className="card animate-slide-up" style={{
                  borderColor: "rgba(212, 163, 115, 0.3)",
                }}>
                  <div className="flex items-center gap-3 mb-4">
                    <div
                      className="w-8 h-8 rounded-lg flex items-center justify-center"
                      style={{
                        background: "rgba(212, 163, 115, 0.15)",
                        color: "#D4A373",
                        fontSize: "16px",
                      }}
                    >
                      ✂️
                    </div>
                    <div>
                      <h3 className="font-semibold text-[var(--foreground)]">
                        Name Your Section
                      </h3>
                      <p className="text-xs" style={{ color: "var(--text-muted)" }}>
                        {pendingSectionAcres
                          ? `~${pendingSectionAcres} acres drawn`
                          : `${pendingSectionPoints.length} vertices drawn`}
                      </p>
                    </div>
                  </div>
                  <div className="space-y-3">
                    <div>
                      <label htmlFor="new-section-name" className="input-label">
                        Section Name *
                      </label>
                      <input
                        id="new-section-name"
                        type="text"
                        className="input-field"
                        placeholder="e.g., North Plot, Rice Paddy"
                        value={newSectionName}
                        onChange={(e) => setNewSectionName(e.target.value)}
                        autoFocus
                      />
                    </div>
                    <div>
                      <label htmlFor="new-section-crop" className="input-label">
                        Assign Crop
                      </label>
                      <select
                        id="new-section-crop"
                        className="input-field"
                        value={newSectionCrop}
                        onChange={(e) => setNewSectionCrop(e.target.value)}
                      >
                        <option value="">-- No crop --</option>
                        {crops.map((crop) => (
                          <option key={crop.id} value={crop.id}>
                            {crop.icon_emoji} {crop.name} ({crop.season})
                          </option>
                        ))}
                      </select>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={handleConfirmNewSection}
                        disabled={!newSectionName.trim()}
                        className="btn btn-primary btn-sm"
                        id="confirm-create-section"
                      >
                        Create Section
                      </button>
                      <button
                        onClick={handleCancelNewSection}
                        className="btn btn-ghost btn-sm"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* Quick-Add Section Form (no drawing) */}
              {showQuickAdd && (
                <div className="card animate-slide-up">
                  <div className="flex items-center gap-3 mb-4">
                    <div
                      className="w-8 h-8 rounded-lg flex items-center justify-center"
                      style={{
                        background: "rgba(64, 145, 108, 0.15)",
                        color: "var(--color-primary-light)",
                        fontSize: "16px",
                      }}
                    >
                      🧩
                    </div>
                    <div>
                      <h3 className="font-semibold text-[var(--foreground)]">
                        New Section
                      </h3>
                      <p className="text-xs" style={{ color: "var(--text-muted)" }}>
                        You can draw its boundary shape later
                      </p>
                    </div>
                  </div>
                  <div className="space-y-3">
                    <div>
                      <label htmlFor="quick-section-name" className="input-label">
                        Section Name *
                      </label>
                      <input
                        id="quick-section-name"
                        type="text"
                        className="input-field"
                        placeholder="e.g., North Plot, Rice Field"
                        value={quickAddName}
                        onChange={(e) => setQuickAddName(e.target.value)}
                        autoFocus
                      />
                    </div>
                    <div>
                      <label htmlFor="quick-section-crop" className="input-label">
                        Assign Crop
                      </label>
                      <select
                        id="quick-section-crop"
                        className="input-field"
                        value={quickAddCrop}
                        onChange={(e) => setQuickAddCrop(e.target.value)}
                      >
                        <option value="">-- No crop --</option>
                        {crops.map((crop) => (
                          <option key={crop.id} value={crop.id}>
                            {crop.icon_emoji} {crop.name} ({crop.season})
                          </option>
                        ))}
                      </select>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={handleQuickAddSection}
                        disabled={!quickAddName.trim()}
                        className="btn btn-primary btn-sm"
                        id="confirm-quick-add"
                      >
                        Create Section
                      </button>
                      <button
                        onClick={() => {
                          setShowQuickAdd(false);
                          setQuickAddName("");
                          setQuickAddCrop("");
                        }}
                        className="btn btn-ghost btn-sm"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* Sections List */}
              {sections.length === 0 && !showNewSectionForm && !isDrawingSection && !showQuickAdd && (
                <div className="text-center py-12">
                  <div className="text-5xl mb-4">🧩</div>
                  <p
                    className="text-sm mb-2"
                    style={{ color: "var(--text-muted)" }}
                  >
                    No sections yet. Split your land into sections for different
                    crops.
                  </p>
                  <div className="flex gap-2 justify-center mt-3">
                    <button
                      onClick={handleStartDrawSection}
                      className="btn btn-primary btn-sm"
                    >
                      ✏️ Draw Section
                    </button>
                    <button
                      onClick={() => setShowQuickAdd(true)}
                      className="btn btn-secondary btn-sm"
                    >
                      + Create Section
                    </button>
                  </div>
                </div>
              )}

              {sections.length > 0 && (
                <div className="space-y-3 stagger">
                  <div className="flex items-center justify-between">
                    <h2 className="text-sm font-semibold" style={{ color: "var(--text-secondary)" }}>
                      Sections
                    </h2>
                  </div>
                  {sections.map((section) => {
                    const isSelected = section.id === selectedSectionId;
                    const hasShape = section.boundary_points && section.boundary_points.length >= 3;

                    return (
                      <div
                        key={section.id}
                        className="card flex items-center gap-4"
                        style={{
                          borderLeftWidth: "4px",
                          borderLeftColor: section.color,
                          borderColor: isSelected ? section.color : undefined,
                          background: isSelected
                            ? "rgba(64, 145, 108, 0.06)"
                            : undefined,
                          cursor: "pointer",
                        }}
                        onClick={() => setSelectedSectionId(
                          isSelected ? null : section.id
                        )}
                      >
                        {/* Color indicator */}
                        <div
                          className="w-10 h-10 rounded-lg flex items-center justify-center text-lg shrink-0"
                          style={{
                            background: `${section.color}25`,
                            color: section.color,
                          }}
                        >
                          {section.crop_emoji || "🌱"}
                        </div>

                        {/* Info */}
                        <div className="flex-1 min-w-0">
                          <h3 className="font-semibold text-[var(--foreground)]">
                            {section.name}
                          </h3>
                          <div className="flex flex-wrap gap-2 mt-1">
                            {section.crop_name && (
                              <span className="badge">{section.crop_name}</span>
                            )}
                            {section.area_acres && (
                              <span className="badge">
                                {section.area_acres} acres
                              </span>
                            )}
                            {!hasShape && (
                              <span className="badge badge-warning" style={{ fontSize: "10px" }}>
                                No shape drawn
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Crop selector */}
                        <select
                          className="input-field text-xs"
                          style={{ width: "130px", padding: "6px 8px" }}
                          value={section.current_crop_id || ""}
                          onClick={(e) => e.stopPropagation()}
                          onChange={(e) =>
                            handleUpdateSectionCrop(section.id, e.target.value)
                          }
                        >
                          <option value="">No crop</option>
                          {crops.map((crop) => (
                            <option key={crop.id} value={crop.id}>
                              {crop.icon_emoji} {crop.name}
                            </option>
                          ))}
                        </select>

                        {/* Actions */}
                        <div className="flex gap-1">
                          {hasShape && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleClearSectionShape(section.id);
                              }}
                              className="btn btn-ghost btn-sm"
                              style={{ color: "var(--color-warning)", padding: "6px 8px", fontSize: "16px" }}
                              title="Clear shape"
                            >
                              ✖️
                            </button>
                          )}
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleStartRedrawSection(section.id);
                            }}
                            className="btn btn-ghost btn-sm"
                            style={{ color: "var(--color-accent)", padding: "6px 8px" }}
                            title="Redraw section shape"
                          >
                            ✏️
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDeleteSection(section.id);
                            }}
                            className="btn btn-ghost btn-sm"
                            style={{ color: "var(--color-error)", padding: "6px 8px" }}
                            title="Delete section"
                          >
                            🗑️
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
}
