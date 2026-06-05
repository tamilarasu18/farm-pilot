"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";

export default function NewCropPage() {
  const router = useRouter();
  
  const [newCropName, setNewCropName] = useState("");
  const [newCropVariety, setNewCropVariety] = useState("");
  const [newCropSeason, setNewCropSeason] = useState("");
  const [newCropDuration, setNewCropDuration] = useState("");
  const [newCropEmoji, setNewCropEmoji] = useState("🌱");
  const [error, setError] = useState("");
  const queryClient = useQueryClient();

  const createCropMutation = useMutation({
    mutationFn: (newCrop: Parameters<typeof api.createCrop>[0]) => api.createCrop(newCrop),
    onSuccess: () => {
      // Invalidate cache so the crops page refetches with the new crop
      queryClient.invalidateQueries({ queryKey: ["crops_and_summaries"] });
      router.push("/crops");
    },
    onError: (err: any) => {
      setError(err.message || "Failed to create crop.");
    }
  });

  const handleCreateCrop = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCropName.trim()) return;

    setError("");
    createCropMutation.mutate({
      name: newCropName.trim(),
      variety: newCropVariety.trim() || undefined,
      season: newCropSeason.trim() || undefined,
      growth_duration_days: newCropDuration ? parseInt(newCropDuration) : undefined,
      icon_emoji: newCropEmoji || "🌱",
    });
  };

  return (
    <div className="max-w-3xl mx-auto animate-fade-in space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <button
          onClick={() => router.push("/crops")}
          className="btn btn-ghost !p-2"
          aria-label="Go back"
        >
          ←
        </button>
        <div>
          <h1 className="text-3xl font-bold text-[var(--foreground)]">Add Custom Crop</h1>
          <p className="text-sm mt-1" style={{ color: "var(--text-secondary)" }}>
            Register a new crop variety to the global catalog.
          </p>
        </div>
      </div>

      <div className="card shadow-lg">
        {error && (
          <div className="p-4 mb-6 rounded-lg text-sm bg-[rgba(239,83,80,0.1)] text-[var(--color-error)]">
            {error}
          </div>
        )}

        <form onSubmit={handleCreateCrop} className="space-y-6">
          <div>
            <label className="input-label">Crop Name *</label>
            <input
              type="text"
              required
              className="input-field"
              placeholder="e.g., Lavender"
              value={newCropName}
              onChange={(e) => setNewCropName(e.target.value)}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="input-label">Variety</label>
              <input
                type="text"
                className="input-field"
                placeholder="e.g., English"
                value={newCropVariety}
                onChange={(e) => setNewCropVariety(e.target.value)}
              />
            </div>
            <div>
              <label className="input-label">Emoji Icon</label>
              <input
                type="text"
                className="input-field text-center text-xl"
                maxLength={2}
                value={newCropEmoji}
                onChange={(e) => setNewCropEmoji(e.target.value)}
              />
              <p className="text-xs mt-1 text-[var(--text-muted)]">A single emoji to represent this crop.</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="input-label">Season</label>
              <input
                type="text"
                className="input-field"
                placeholder="e.g., Summer"
                value={newCropSeason}
                onChange={(e) => setNewCropSeason(e.target.value)}
              />
            </div>
            <div>
              <label className="input-label">Duration (Days)</label>
              <input
                type="number"
                min="1"
                className="input-field"
                placeholder="e.g., 90"
                value={newCropDuration}
                onChange={(e) => setNewCropDuration(e.target.value)}
              />
            </div>
          </div>

          <div className="pt-6 flex gap-3 justify-end border-t border-[var(--border)] mt-4">
            <button
              type="button"
              className="btn btn-secondary"
              onClick={() => router.push("/crops")}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={createCropMutation.isPending}
              className="btn btn-primary"
            >
              {createCropMutation.isPending ? "Adding..." : "Add Custom Crop"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
