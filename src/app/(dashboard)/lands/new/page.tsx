"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api";

export default function NewLandPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [address, setAddress] = useState("");
  const [area, setArea] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    try {
      const land = await api.createLand({
        name,
        address: address || undefined,
        total_area_acres: area ? parseFloat(area) : undefined,
      });
      router.push(`/lands/${land.id}`);
    } catch {
      setError("Failed to create land. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-lg mx-auto animate-fade-in">
      {/* Header */}
      <div className="mb-8">
        <button
          onClick={() => router.back()}
          className="btn btn-ghost btn-sm mb-4"
          style={{ color: "var(--text-secondary)" }}
        >
          ← Back to Lands
        </button>
        <h1 className="text-2xl font-bold text-[var(--foreground)]">
          Add New Land
        </h1>
        <p className="text-sm mt-1" style={{ color: "var(--text-secondary)" }}>
          Enter your land details to get started
        </p>
      </div>

      {error && (
        <div
          className="mb-6 p-3 rounded-lg text-sm"
          style={{
            background: "rgba(239, 83, 80, 0.1)",
            border: "1px solid rgba(239, 83, 80, 0.3)",
            color: "var(--color-error)",
          }}
        >
          {error}
        </div>
      )}

      <div className="card">
        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label htmlFor="land-name" className="input-label">
              Land Name *
            </label>
            <input
              id="land-name"
              type="text"
              className="input-field"
              placeholder="e.g., North Field, River Plot"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </div>

          <div>
            <label htmlFor="land-address" className="input-label">
              Location / Address
            </label>
            <input
              id="land-address"
              type="text"
              className="input-field"
              placeholder="e.g., Village name, District"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
            />
          </div>

          <div>
            <label htmlFor="land-area" className="input-label">
              Estimated Area (acres)
            </label>
            <input
              id="land-area"
              type="number"
              step="0.01"
              min="0"
              className="input-field"
              placeholder="e.g., 5.5"
              value={area}
              onChange={(e) => setArea(e.target.value)}
            />
            <p className="text-xs mt-1" style={{ color: "var(--text-muted)" }}>
              You can adjust this later by drawing your land boundary
            </p>
          </div>

          <div className="flex gap-3 pt-2">
            <button
              type="submit"
              disabled={isLoading}
              className="btn btn-primary btn-lg"
              id="create-land-btn"
            >
              {isLoading ? "Creating..." : "Create & Draw Land"}
            </button>
            <button
              type="button"
              onClick={() => router.back()}
              className="btn btn-secondary btn-lg"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
