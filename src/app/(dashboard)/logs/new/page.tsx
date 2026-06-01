"use client";

import { useEffect, useState, type FormEvent, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { api } from "@/lib/api";
import type { Land, Section, ExpenseCreate } from "@/lib/types";

const ACTIVITY_TYPES = [
  { value: "planting", label: "Planting", icon: "🌱" },
  { value: "watering", label: "Watering", icon: "💧" },
  { value: "fertilizing", label: "Fertilizing", icon: "🧪" },
  { value: "weeding", label: "Weeding", icon: "🌿" },
  { value: "harvesting", label: "Harvesting", icon: "🌾" },
  { value: "spraying", label: "Spraying", icon: "💊" },
  { value: "pruning", label: "Pruning", icon: "✂️" },
  { value: "inspection", label: "Inspection", icon: "🔍" },
  { value: "other", label: "Other", icon: "📋" },
];

const WEATHER_CONDITIONS = [
  { value: "sunny", label: "Sunny", icon: "☀️" },
  { value: "cloudy", label: "Cloudy", icon: "☁️" },
  { value: "rainy", label: "Rainy", icon: "🌧️" },
  { value: "stormy", label: "Stormy", icon: "⛈️" },
  { value: "windy", label: "Windy", icon: "💨" },
  { value: "foggy", label: "Foggy", icon: "🌫️" },
];

const EXPENSE_CATEGORIES = [
  "seeds",
  "fertilizer",
  "pesticide",
  "labor",
  "equipment",
  "fuel",
  "water",
  "transport",
  "other",
];

function NewLogForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialSection = searchParams.get("section") || "";

  const [step, setStep] = useState(1);
  const [lands, setLands] = useState<Land[]>([]);
  const [sections, setSections] = useState<Record<string, Section[]>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");

  // Form state
  const [sectionId, setSectionId] = useState(initialSection);
  const [logDate, setLogDate] = useState(
    new Date().toISOString().split("T")[0]
  );
  const [activityType, setActivityType] = useState("watering");
  const [notes, setNotes] = useState("");
  const [temperatureC, setTemperatureC] = useState("");
  const [humidityPct, setHumidityPct] = useState("");
  const [rainfallMm, setRainfallMm] = useState("");
  const [weatherCondition, setWeatherCondition] = useState("");
  const [cropStage, setCropStage] = useState("");
  const [cropHealthNotes, setCropHealthNotes] = useState("");
  const [expenses, setExpenses] = useState<
    { category: string; description: string; amount: string }[]
  >([]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const landsData = await api.getLands();
        setLands(landsData);
        const sectionsMap: Record<string, Section[]> = {};
        for (const land of landsData) {
          sectionsMap[land.id] = await api.getSections(land.id);
        }
        setSections(sectionsMap);
      } catch {
        // handle error
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, []);

  const addExpense = () => {
    setExpenses([...expenses, { category: "labor", description: "", amount: "" }]);
  };

  const removeExpense = (index: number) => {
    setExpenses(expenses.filter((_, i) => i !== index));
  };

  const updateExpense = (index: number, field: string, value: string) => {
    const updated = [...expenses];
    (updated[index] as Record<string, string>)[field] = value;
    setExpenses(updated);
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!sectionId) {
      setError("Please select a section");
      return;
    }

    setIsSubmitting(true);
    setError("");

    try {
      const expenseItems: ExpenseCreate[] = expenses
        .filter((exp) => exp.amount && parseFloat(exp.amount) > 0)
        .map((exp) => ({
          category: exp.category,
          description: exp.description || undefined,
          amount: parseFloat(exp.amount),
        }));

      await api.createDailyLog(sectionId, {
        log_date: logDate,
        activity_type: activityType,
        notes: notes || undefined,
        temperature_c: temperatureC ? parseFloat(temperatureC) : undefined,
        humidity_pct: humidityPct ? parseFloat(humidityPct) : undefined,
        rainfall_mm: rainfallMm ? parseFloat(rainfallMm) : undefined,
        weather_condition: weatherCondition || undefined,
        crop_stage: cropStage || undefined,
        crop_health_notes: cropHealthNotes || undefined,
        expenses: expenseItems.length > 0 ? expenseItems : undefined,
      });

      router.push("/logs");
    } catch {
      setError("Failed to create log entry. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const totalExpense = expenses.reduce(
    (sum, e) => sum + (parseFloat(e.amount) || 0),
    0
  );

  if (isLoading) {
    return (
      <div className="max-w-2xl mx-auto">
        <div className="skeleton h-8 w-48 mb-6" />
        <div className="skeleton h-96 w-full rounded-xl" />
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto animate-fade-in">
      {/* Header */}
      <div className="mb-6">
        <button
          onClick={() => router.back()}
          className="btn btn-ghost btn-sm mb-2"
          style={{ color: "var(--text-secondary)" }}
        >
          ← Back
        </button>
        <h1 className="text-2xl font-bold text-[var(--foreground)]">
          New Daily Log
        </h1>
        <p className="text-sm mt-1" style={{ color: "var(--text-secondary)" }}>
          Record your farming activity
        </p>
      </div>

      {/* Progress Steps */}
      <div className="flex items-center gap-2 mb-8">
        {[
          { num: 1, label: "Activity" },
          { num: 2, label: "Climate" },
          { num: 3, label: "Expenses" },
        ].map((s) => (
          <button
            key={s.num}
            onClick={() => setStep(s.num)}
            className="flex items-center gap-2 flex-1 py-2 px-3 rounded-lg text-xs font-medium transition-all"
            style={{
              background:
                step === s.num
                  ? "rgba(64, 145, 108, 0.15)"
                  : "transparent",
              color:
                step >= s.num
                  ? "var(--color-primary-light)"
                  : "var(--text-muted)",
              border:
                step === s.num
                  ? "1px solid rgba(64, 145, 108, 0.3)"
                  : "1px solid transparent",
            }}
          >
            <span
              className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold"
              style={{
                background:
                  step >= s.num
                    ? "var(--color-primary)"
                    : "var(--surface-light)",
                color: step >= s.num ? "white" : "var(--text-muted)",
              }}
            >
              {s.num}
            </span>
            {s.label}
          </button>
        ))}
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

      <form onSubmit={handleSubmit}>
        {/* Step 1: Activity */}
        {step === 1 && (
          <div className="card space-y-5 animate-fade-in">
            <div>
              <label htmlFor="log-section" className="input-label">
                Select Section *
              </label>
              <select
                id="log-section"
                className="input-field"
                value={sectionId}
                onChange={(e) => setSectionId(e.target.value)}
                required
              >
                <option value="">-- Choose a section --</option>
                {lands.map((land) => (
                  <optgroup key={land.id} label={`🗺️ ${land.name}`}>
                    {(sections[land.id] || []).map((section) => (
                      <option key={section.id} value={section.id}>
                        {section.crop_emoji || "🌱"} {section.name}
                      </option>
                    ))}
                  </optgroup>
                ))}
              </select>
            </div>

            <div>
              <label htmlFor="log-date" className="input-label">
                Date *
              </label>
              <input
                id="log-date"
                type="date"
                className="input-field"
                value={logDate}
                onChange={(e) => setLogDate(e.target.value)}
                required
              />
            </div>

            <div>
              <label className="input-label">Activity Type *</label>
              <div className="grid grid-cols-3 gap-2">
                {ACTIVITY_TYPES.map((act) => (
                  <button
                    key={act.value}
                    type="button"
                    onClick={() => setActivityType(act.value)}
                    className="p-3 rounded-lg text-center text-sm transition-all"
                    style={{
                      background:
                        activityType === act.value
                          ? "rgba(64, 145, 108, 0.2)"
                          : "var(--surface)",
                      border:
                        activityType === act.value
                          ? "2px solid var(--color-primary-light)"
                          : "1px solid var(--border)",
                      color:
                        activityType === act.value
                          ? "var(--color-primary-light)"
                          : "var(--text-secondary)",
                    }}
                  >
                    <div className="text-xl mb-1">{act.icon}</div>
                    {act.label}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label htmlFor="log-notes" className="input-label">
                Notes
              </label>
              <textarea
                id="log-notes"
                className="input-field"
                rows={3}
                placeholder="Any additional notes..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                style={{ resize: "vertical" }}
              />
            </div>

            <div className="flex justify-end">
              <button
                type="button"
                onClick={() => setStep(2)}
                className="btn btn-primary"
              >
                Next: Climate →
              </button>
            </div>
          </div>
        )}

        {/* Step 2: Climate & Crop */}
        {step === 2 && (
          <div className="card space-y-5 animate-fade-in">
            <div>
              <label className="input-label">Weather Condition</label>
              <div className="grid grid-cols-3 gap-2">
                {WEATHER_CONDITIONS.map((w) => (
                  <button
                    key={w.value}
                    type="button"
                    onClick={() =>
                      setWeatherCondition(
                        weatherCondition === w.value ? "" : w.value
                      )
                    }
                    className="p-3 rounded-lg text-center text-sm transition-all"
                    style={{
                      background:
                        weatherCondition === w.value
                          ? "rgba(64, 145, 108, 0.2)"
                          : "var(--surface)",
                      border:
                        weatherCondition === w.value
                          ? "2px solid var(--color-primary-light)"
                          : "1px solid var(--border)",
                      color:
                        weatherCondition === w.value
                          ? "var(--color-primary-light)"
                          : "var(--text-secondary)",
                    }}
                  >
                    <div className="text-2xl mb-1">{w.icon}</div>
                    {w.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div>
                <label htmlFor="log-temp" className="input-label">
                  🌡️ Temp (°C)
                </label>
                <input
                  id="log-temp"
                  type="number"
                  step="0.1"
                  className="input-field"
                  placeholder="32"
                  value={temperatureC}
                  onChange={(e) => setTemperatureC(e.target.value)}
                />
              </div>
              <div>
                <label htmlFor="log-humidity" className="input-label">
                  💧 Humidity (%)
                </label>
                <input
                  id="log-humidity"
                  type="number"
                  step="1"
                  min="0"
                  max="100"
                  className="input-field"
                  placeholder="65"
                  value={humidityPct}
                  onChange={(e) => setHumidityPct(e.target.value)}
                />
              </div>
              <div>
                <label htmlFor="log-rainfall" className="input-label">
                  🌧️ Rainfall (mm)
                </label>
                <input
                  id="log-rainfall"
                  type="number"
                  step="0.1"
                  min="0"
                  className="input-field"
                  placeholder="0"
                  value={rainfallMm}
                  onChange={(e) => setRainfallMm(e.target.value)}
                />
              </div>
            </div>

            <div>
              <label htmlFor="log-crop-stage" className="input-label">
                Crop Stage
              </label>
              <select
                id="log-crop-stage"
                className="input-field"
                value={cropStage}
                onChange={(e) => setCropStage(e.target.value)}
              >
                <option value="">-- Select stage --</option>
                <option value="seedling">🌱 Seedling</option>
                <option value="vegetative">🌿 Vegetative</option>
                <option value="flowering">🌸 Flowering</option>
                <option value="fruiting">🍎 Fruiting</option>
                <option value="harvest-ready">🌾 Harvest Ready</option>
                <option value="harvested">✅ Harvested</option>
              </select>
            </div>

            <div>
              <label htmlFor="log-crop-health" className="input-label">
                Crop Health Notes
              </label>
              <textarea
                id="log-crop-health"
                className="input-field"
                rows={2}
                placeholder="Describe crop health status..."
                value={cropHealthNotes}
                onChange={(e) => setCropHealthNotes(e.target.value)}
                style={{ resize: "vertical" }}
              />
            </div>

            <div className="flex justify-between">
              <button
                type="button"
                onClick={() => setStep(1)}
                className="btn btn-secondary"
              >
                ← Back
              </button>
              <button
                type="button"
                onClick={() => setStep(3)}
                className="btn btn-primary"
              >
                Next: Expenses →
              </button>
            </div>
          </div>
        )}

        {/* Step 3: Expenses */}
        {step === 3 && (
          <div className="card space-y-5 animate-fade-in">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-[var(--foreground)]">
                Expenses
              </h3>
              <button
                type="button"
                onClick={addExpense}
                className="btn btn-secondary btn-sm"
                id="add-expense-btn"
              >
                + Add Expense
              </button>
            </div>

            {expenses.length === 0 && (
              <p className="text-sm text-center py-6" style={{ color: "var(--text-muted)" }}>
                No expenses added. Click &quot;Add Expense&quot; or submit without expenses.
              </p>
            )}

            {expenses.map((exp, i) => (
              <div
                key={i}
                className="flex flex-wrap gap-2 items-end p-3 rounded-lg animate-fade-in"
                style={{
                  background: "var(--surface)",
                  border: "1px solid var(--border)",
                }}
              >
                <div className="flex-1 min-w-[120px]">
                  <label className="input-label text-xs">Category</label>
                  <select
                    className="input-field text-sm"
                    value={exp.category}
                    onChange={(e) =>
                      updateExpense(i, "category", e.target.value)
                    }
                  >
                    {EXPENSE_CATEGORIES.map((cat) => (
                      <option key={cat} value={cat}>
                        {cat.charAt(0).toUpperCase() + cat.slice(1)}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="flex-1 min-w-[150px]">
                  <label className="input-label text-xs">Description</label>
                  <input
                    type="text"
                    className="input-field text-sm"
                    placeholder="Optional"
                    value={exp.description}
                    onChange={(e) =>
                      updateExpense(i, "description", e.target.value)
                    }
                  />
                </div>
                <div className="w-28">
                  <label className="input-label text-xs">Amount (₹)</label>
                  <input
                    type="number"
                    step="1"
                    min="0"
                    className="input-field text-sm"
                    placeholder="0"
                    value={exp.amount}
                    onChange={(e) =>
                      updateExpense(i, "amount", e.target.value)
                    }
                  />
                </div>
                <button
                  type="button"
                  onClick={() => removeExpense(i)}
                  className="btn btn-ghost btn-sm"
                  style={{ color: "var(--color-error)" }}
                >
                  ✕
                </button>
              </div>
            ))}

            {expenses.length > 0 && (
              <div
                className="flex justify-between items-center pt-3"
                style={{ borderTop: "1px solid var(--border)" }}
              >
                <span
                  className="text-sm font-semibold"
                  style={{ color: "var(--text-secondary)" }}
                >
                  Total
                </span>
                <span className="text-lg font-bold text-[var(--foreground)]">
                  ₹{totalExpense.toLocaleString()}
                </span>
              </div>
            )}

            <div className="flex justify-between pt-2">
              <button
                type="button"
                onClick={() => setStep(2)}
                className="btn btn-secondary"
              >
                ← Back
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="btn btn-primary btn-lg"
                id="submit-log-btn"
              >
                {isSubmitting ? "Saving..." : "✅ Save Log Entry"}
              </button>
            </div>
          </div>
        )}
      </form>
    </div>
  );
}

export default function NewLogPage() {
  return (
    <Suspense
      fallback={
        <div className="max-w-2xl mx-auto">
          <div className="skeleton h-8 w-48 mb-6" />
          <div className="skeleton h-96 w-full rounded-xl" />
        </div>
      }
    >
      <NewLogForm />
    </Suspense>
  );
}
