"use client";

import { useEffect, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import type { Land, Section } from "@/lib/types";

export default function NewSoilTestPage() {
  const router = useRouter();
  const queryClient = useQueryClient();

  const [lands, setLands] = useState<Land[]>([]);
  const [sections, setSections] = useState<Record<string, Section[]>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");

  // Form State
  const [landId, setLandId] = useState("");
  const [sectionId, setSectionId] = useState("");
  const [testDate, setTestDate] = useState(new Date().toISOString().split("T")[0]);
  const [labName, setLabName] = useState("");
  const [sampleDepth, setSampleDepth] = useState("");
  const [notes, setNotes] = useState("");
  const [measurementUnit, setMeasurementUnit] = useState("ppm");

  const [phLevel, setPhLevel] = useState("");
  const [ecLevel, setEcLevel] = useState("");
  const [organicCarbon, setOrganicCarbon] = useState("");
  const [nitrogen, setNitrogen] = useState("");
  const [phosphorus, setPhosphorus] = useState("");
  const [potassium, setPotassium] = useState("");

  useEffect(() => {
    const fetchData = async () => {
      try {
        const landsData = await api.getLands();
        setLands(landsData);
        if (landsData.length > 0) {
          setLandId(landsData[0].id);
        }
        
        const sectionsMap: Record<string, Section[]> = {};
        for (const land of landsData) {
          sectionsMap[land.id] = await api.getSections(land.id);
        }
        setSections(sectionsMap);
      } catch {
        setError("Failed to load lands and sections.");
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, []);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!landId) {
      setError("Please select a land.");
      return;
    }

    setIsSubmitting(true);
    setError("");

    try {
      await api.createSoilTest({
        land_id: landId,
        section_id: sectionId || undefined,
        test_date: testDate,
        lab_name: labName || undefined,
        sample_depth: sampleDepth || undefined,
        notes: notes || undefined,
        measurement_unit: measurementUnit,
        ph_level: phLevel ? parseFloat(phLevel) : undefined,
        ec_level: ecLevel ? parseFloat(ecLevel) : undefined,
        organic_carbon: organicCarbon ? parseFloat(organicCarbon) : undefined,
        nitrogen: nitrogen ? parseFloat(nitrogen) : undefined,
        phosphorus: phosphorus ? parseFloat(phosphorus) : undefined,
        potassium: potassium ? parseFloat(potassium) : undefined,
      });

      await queryClient.invalidateQueries({ queryKey: ["soil-tests"] });
      router.push("/soil-tests");
    } catch {
      setError("Failed to save soil test record.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="max-w-3xl mx-auto">
        <div className="skeleton h-8 w-48 mb-6" />
        <div className="skeleton h-96 w-full rounded-xl" />
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto animate-fade-in">
      <div className="mb-8">
        <button
          onClick={() => router.back()}
          className="btn btn-ghost btn-sm mb-4"
          style={{ color: "var(--text-secondary)" }}
        >
          ← Back
        </button>
        <h1 className="text-3xl font-bold text-[var(--foreground)]">
          Record Soil Test
        </h1>
        <p className="text-sm mt-2" style={{ color: "var(--text-secondary)" }}>
          Manually enter your laboratory soil test results.
        </p>
      </div>

      {error && (
        <div
          className="mb-6 p-4 rounded-xl text-sm font-medium animate-fade-in flex items-center gap-2"
          style={{
            background: "rgba(239, 83, 80, 0.1)",
            border: "1px solid rgba(239, 83, 80, 0.3)",
            color: "var(--color-error)",
          }}
        >
          ⚠️ {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="card">
          <h3 className="font-bold text-lg mb-4 text-[var(--foreground)]">Sample Details</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="input-label">Select Land *</label>
              <select className="input-field" value={landId} onChange={(e) => { setLandId(e.target.value); setSectionId(""); }} required>
                <option value="">-- Choose Land --</option>
                {lands.map(l => <option key={l.id} value={l.id}>{l.name}</option>)}
              </select>
            </div>
            <div>
              <label className="input-label">Select Section (Optional)</label>
              <select className="input-field" value={sectionId} onChange={(e) => setSectionId(e.target.value)} disabled={!landId}>
                <option value="">-- Entire Land / None --</option>
                {(sections[landId] || []).map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
              </select>
            </div>
            <div>
              <label className="input-label">Test Date *</label>
              <input type="date" className="input-field" value={testDate} onChange={(e) => setTestDate(e.target.value)} required />
            </div>
            <div>
              <label className="input-label">Lab Name</label>
              <input type="text" className="input-field" placeholder="e.g. AgriLab Solutions" value={labName} onChange={(e) => setLabName(e.target.value)} />
            </div>
          </div>
        </div>

        <div className="card">
          <h3 className="font-bold text-lg mb-4 text-[var(--foreground)]">Basic Characteristics</h3>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            <div>
              <label className="input-label">pH Level</label>
              <input type="number" step="0.1" className="input-field" placeholder="e.g. 6.5" value={phLevel} onChange={(e) => setPhLevel(e.target.value)} />
            </div>
            <div>
              <label className="input-label">Electrical Conductivity (EC)</label>
              <input type="number" step="0.01" className="input-field" placeholder="e.g. 1.2" value={ecLevel} onChange={(e) => setEcLevel(e.target.value)} />
            </div>
            <div>
              <label className="input-label">Organic Carbon (%)</label>
              <input type="number" step="0.01" className="input-field" placeholder="e.g. 0.8" value={organicCarbon} onChange={(e) => setOrganicCarbon(e.target.value)} />
            </div>
          </div>
        </div>

        <div className="card">
          <div className="flex justify-between items-center mb-4">
            <h3 className="font-bold text-lg text-[var(--foreground)]">Macronutrients (NPK)</h3>
            <select className="input-field !w-auto !py-1 !text-sm" value={measurementUnit} onChange={(e) => setMeasurementUnit(e.target.value)}>
              <option value="ppm">ppm</option>
              <option value="kg/ha">kg/ha</option>
              <option value="lb/acre">lb/acre</option>
            </select>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            <div>
              <label className="input-label">Nitrogen (N)</label>
              <input type="number" step="0.1" className="input-field" placeholder="0" value={nitrogen} onChange={(e) => setNitrogen(e.target.value)} />
            </div>
            <div>
              <label className="input-label">Phosphorus (P)</label>
              <input type="number" step="0.1" className="input-field" placeholder="0" value={phosphorus} onChange={(e) => setPhosphorus(e.target.value)} />
            </div>
            <div>
              <label className="input-label">Potassium (K)</label>
              <input type="number" step="0.1" className="input-field" placeholder="0" value={potassium} onChange={(e) => setPotassium(e.target.value)} />
            </div>
          </div>
        </div>

        <div className="flex justify-end pt-4">
          <button type="submit" disabled={isSubmitting} className="btn btn-primary btn-lg px-10 shadow-lg">
            {isSubmitting ? "Saving..." : "✅ Save Soil Test"}
          </button>
        </div>
      </form>
    </div>
  );
}
