"use client";

import { useEffect, useState, type FormEvent, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import type { Land, Section, ExpenseCreate, IncomeCreate } from "@/lib/types";

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
  "transport",
  "other",
];

const INCOME_CATEGORIES = [
  "harvest_sale",
  "subsidy",
  "other",
];

function NewLogForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const queryClient = useQueryClient();
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
  const [incomes, setIncomes] = useState<
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

  const addIncome = () => {
    setIncomes([...incomes, { category: "harvest_sale", description: "", amount: "" }]);
  };

  const removeIncome = (index: number) => {
    setIncomes(incomes.filter((_, i) => i !== index));
  };

  const updateIncome = (index: number, field: string, value: string) => {
    const updated = [...incomes];
    (updated[index] as Record<string, string>)[field] = value;
    setIncomes(updated);
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

      const log = await api.createDailyLog(sectionId, {
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

      // Add incomes if any
      const incomeItems: IncomeCreate[] = incomes
        .filter((inc) => inc.amount && parseFloat(inc.amount) > 0)
        .map((inc) => ({
          category: inc.category,
          description: inc.description || undefined,
          amount: parseFloat(inc.amount),
        }));
      
      if (incomeItems.length > 0) {
        for (const inc of incomeItems) {
          await api.addIncome(log.id, inc);
        }
      }

      await queryClient.invalidateQueries({ queryKey: ["logs"] });
      router.push(`/logs?section=${sectionId}`);
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

  const totalIncome = incomes.reduce(
    (sum, inc) => sum + (parseFloat(inc.amount) || 0),
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
    <div className="max-w-5xl mx-auto animate-fade-in">
      {/* Header */}
      <div className="mb-8">
        <button
          onClick={() => router.back()}
          className="btn btn-ghost btn-sm mb-4"
          style={{ color: "var(--text-secondary)" }}
        >
          ← Back
        </button>
        <h1 className="text-3xl font-bold text-[var(--foreground)]">
          New Daily Log
        </h1>
        <p className="text-sm mt-2" style={{ color: "var(--text-secondary)" }}>
          Record your farming activity, climate conditions, and related expenses
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-12 gap-8">
        {/* Left Column: Stepper & Summary */}
        <div className="md:col-span-4">
          <div className="card sticky top-6">
            <h3 className="font-bold text-lg mb-6 text-[var(--foreground)]">Progress</h3>
            <div className="space-y-6">
              {[
                { num: 1, label: "Activity", desc: "Select land and task" },
                { num: 2, label: "Climate", desc: "Weather & crop health" },
                { num: 3, label: "Finances", desc: "Log incomes & expenses" },
              ].map((s, idx) => (
                <div key={s.num} className="relative flex gap-4">
                  {/* Vertical Line */}
                  {idx < 2 && (
                    <div 
                      className="absolute left-[15px] top-10 bottom-[-24px] w-[2px]" 
                      style={{ background: step > s.num ? "var(--color-primary)" : "var(--surface-lighter)" }} 
                    />
                  )}
                  {/* Step Circle */}
                  <div className="relative z-10 shrink-0">
                    <button
                      type="button"
                      onClick={() => setStep(s.num)}
                      className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold transition-all"
                      style={{
                        background: step >= s.num ? "var(--color-primary)" : "var(--surface-light)",
                        color: step >= s.num ? "white" : "var(--text-muted)",
                        boxShadow: step === s.num ? "0 0 0 4px rgba(64, 145, 108, 0.2)" : "none",
                      }}
                    >
                      {step > s.num ? "✓" : s.num}
                    </button>
                  </div>
                  {/* Step Content */}
                  <div>
                    <button
                      type="button"
                      onClick={() => setStep(s.num)}
                      className="text-left"
                    >
                      <p className="font-semibold" style={{ color: step === s.num ? "var(--color-primary-light)" : "var(--foreground)" }}>
                        {s.label}
                      </p>
                      <p className="text-xs mt-1" style={{ color: "var(--text-muted)" }}>
                        {s.desc}
                      </p>
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {/* Quick Summary */}
            {(sectionId || activityType || totalExpense > 0 || totalIncome > 0) && (
              <div className="mt-8 pt-6" style={{ borderTop: "1px solid var(--border)" }}>
                <h4 className="text-sm font-semibold mb-3" style={{ color: "var(--text-secondary)" }}>Current Selection</h4>
                <div className="space-y-3 text-sm">
                  {sectionId && (
                    <div className="flex items-center gap-2">
                      <span className="opacity-70">📍</span>
                      <span className="font-medium text-[var(--foreground)]">Section Selected</span>
                    </div>
                  )}
                  {activityType && (
                    <div className="flex items-center gap-2">
                      <span>{ACTIVITY_TYPES.find(a => a.value === activityType)?.icon}</span>
                      <span className="font-medium text-[var(--foreground)]">
                        {ACTIVITY_TYPES.find(a => a.value === activityType)?.label}
                      </span>
                    </div>
                  )}
                  {totalExpense > 0 && (
                    <div className="flex items-center gap-2 mt-2 pt-2" style={{ borderTop: "1px dashed var(--border)" }}>
                      <span className="opacity-70">📉</span>
                      <span className="font-bold text-[var(--color-error)]">- ₹{totalExpense.toLocaleString()}</span>
                    </div>
                  )}
                  {totalIncome > 0 && (
                    <div className="flex items-center gap-2 mt-1">
                      <span className="opacity-70">📈</span>
                      <span className="font-bold text-[var(--color-success)]">+ ₹{totalIncome.toLocaleString()}</span>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Active Form */}
        <div className="md:col-span-8">
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

          <form onSubmit={handleSubmit}>
            {/* Step 1: Activity */}
            {step === 1 && (
              <div className="card space-y-6 animate-fade-in">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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
                </div>

                <div>
                  <label className="input-label">Activity Type *</label>
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                    {ACTIVITY_TYPES.map((act) => (
                      <button
                        key={act.value}
                        type="button"
                        onClick={() => setActivityType(act.value)}
                        className="p-4 rounded-xl text-center text-sm font-medium transition-all"
                        style={{
                          background:
                            activityType === act.value
                              ? "rgba(64, 145, 108, 0.15)"
                              : "var(--color-surface)",
                          border:
                            activityType === act.value
                              ? "2px solid var(--color-primary-light)"
                              : "1px solid var(--border)",
                          color:
                            activityType === act.value
                              ? "var(--color-primary-light)"
                              : "var(--text-secondary)",
                          boxShadow: activityType === act.value ? "0 4px 12px rgba(64, 145, 108, 0.1)" : "none"
                        }}
                      >
                        <div className="text-2xl mb-2">{act.icon}</div>
                        {act.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label htmlFor="log-notes" className="input-label">
                    Activity Notes
                  </label>
                  <textarea
                    id="log-notes"
                    className="input-field"
                    rows={4}
                    placeholder="Any additional details about this activity..."
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    style={{ resize: "vertical" }}
                  />
                </div>

                <div className="flex justify-end pt-4" style={{ borderTop: "1px solid var(--border)" }}>
                  <button
                    type="button"
                    onClick={() => setStep(2)}
                    className="btn btn-primary px-8"
                  >
                    Next: Climate →
                  </button>
                </div>
              </div>
            )}

            {/* Step 2: Climate & Crop */}
            {step === 2 && (
              <div className="card space-y-6 animate-fade-in">
                <div>
                  <label className="input-label">Weather Condition</label>
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                    {WEATHER_CONDITIONS.map((w) => (
                      <button
                        key={w.value}
                        type="button"
                        onClick={() =>
                          setWeatherCondition(
                            weatherCondition === w.value ? "" : w.value
                          )
                        }
                        className="p-4 rounded-xl text-center text-sm font-medium transition-all"
                        style={{
                          background:
                            weatherCondition === w.value
                              ? "rgba(64, 145, 108, 0.15)"
                              : "var(--color-surface)",
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
                        <div className="text-2xl mb-2">{w.icon}</div>
                        {w.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
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
                    className="input-field max-w-md"
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
                    rows={3}
                    placeholder="Describe any pests, diseases, or overall health status..."
                    value={cropHealthNotes}
                    onChange={(e) => setCropHealthNotes(e.target.value)}
                    style={{ resize: "vertical" }}
                  />
                </div>

                <div className="flex justify-between items-center pt-4" style={{ borderTop: "1px solid var(--border)" }}>
                  <button
                    type="button"
                    onClick={() => setStep(1)}
                    className="btn btn-ghost"
                  >
                    ← Back
                  </button>
                  <button
                    type="button"
                    onClick={() => setStep(3)}
                    className="btn btn-primary px-8"
                  >
                    Next: Expenses →
                  </button>
                </div>
              </div>
            )}

            {/* Step 3: Expenses */}
            {step === 3 && (
              <div className="card space-y-6 animate-fade-in">
                <div className="flex items-center justify-between pb-4" style={{ borderBottom: "1px solid var(--border)" }}>
                  <div>
                    <h3 className="font-bold text-lg text-[var(--foreground)]">
                      Financials
                    </h3>
                    <p className="text-sm" style={{ color: "var(--text-muted)" }}>
                      Log incomes (harvest sales) and expenses (costs)
                    </p>
                  </div>
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
                  <div className="text-center py-10 rounded-xl" style={{ border: "1px dashed var(--border)", background: "rgba(0,0,0,0.02)" }}>
                    <p className="text-sm" style={{ color: "var(--text-muted)" }}>
                      No expenses added yet.
                    </p>
                    <button
                      type="button"
                      onClick={addExpense}
                      className="btn btn-ghost btn-sm mt-3"
                    >
                      + Add the first expense
                    </button>
                  </div>
                )}

                <div className="space-y-4">
                  {expenses.map((exp, i) => (
                    <div
                      key={i}
                      className="flex flex-col sm:flex-row gap-4 items-start sm:items-end p-4 rounded-xl animate-fade-in"
                      style={{
                        background: "var(--color-surface)",
                        border: "1px solid var(--border)",
                      }}
                    >
                      <div className="w-full sm:w-1/3">
                        <label className="input-label text-xs">Category</label>
                        <select
                          className="input-field"
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
                      <div className="w-full sm:flex-1">
                        <label className="input-label text-xs">Description</label>
                        <input
                          type="text"
                          className="input-field"
                          placeholder="What was purchased?"
                          value={exp.description}
                          onChange={(e) =>
                            updateExpense(i, "description", e.target.value)
                          }
                        />
                      </div>
                      <div className="w-full sm:w-32">
                        <label className="input-label text-xs">Amount (₹)</label>
                        <input
                          type="number"
                          step="1"
                          min="0"
                          className="input-field"
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
                        className="btn btn-ghost sm:mb-[2px] w-full sm:w-auto mt-2 sm:mt-0 p-3"
                        style={{ color: "var(--color-error)", background: "rgba(239, 83, 80, 0.05)" }}
                      >
                        ✕ Remove
                      </button>
                    </div>
                  ))}
                </div>

                  {expenses.length > 0 && (
                    <div
                      className="flex justify-between items-center pt-4 mt-2"
                      style={{ borderTop: "1px solid var(--border)" }}
                    >
                      <span
                        className="text-sm font-semibold uppercase tracking-wider"
                        style={{ color: "var(--text-secondary)" }}
                      >
                        Total Expenses
                      </span>
                      <span className="text-xl font-bold text-[var(--color-error)]">
                        - ₹{totalExpense.toLocaleString()}
                      </span>
                    </div>
                  )}

                <div className="pt-6" style={{ borderTop: "1px dashed var(--border)" }}>
                  <div className="flex items-center justify-between mb-4">
                    <h4 className="font-bold text-[var(--foreground)]">Income / Revenue</h4>
                    <button
                      type="button"
                      onClick={addIncome}
                      className="btn btn-secondary btn-sm"
                    >
                      + Add Income
                    </button>
                  </div>

                  <div className="space-y-4">
                    {incomes.map((inc, i) => (
                      <div
                        key={i}
                        className="flex flex-col sm:flex-row gap-4 items-start sm:items-end p-4 rounded-xl animate-fade-in"
                        style={{
                          background: "rgba(64, 145, 108, 0.05)",
                          border: "1px solid rgba(64, 145, 108, 0.2)",
                        }}
                      >
                        <div className="w-full sm:w-1/3">
                          <label className="input-label text-xs">Category</label>
                          <select
                            className="input-field"
                            value={inc.category}
                            onChange={(e) => updateIncome(i, "category", e.target.value)}
                          >
                            {INCOME_CATEGORIES.map((cat) => (
                              <option key={cat} value={cat}>
                                {cat.replace("_", " ").charAt(0).toUpperCase() + cat.replace("_", " ").slice(1)}
                              </option>
                            ))}
                          </select>
                        </div>
                        <div className="w-full sm:flex-1">
                          <label className="input-label text-xs">Description</label>
                          <input
                            type="text"
                            className="input-field"
                            placeholder="Sale details"
                            value={inc.description}
                            onChange={(e) => updateIncome(i, "description", e.target.value)}
                          />
                        </div>
                        <div className="w-full sm:w-32">
                          <label className="input-label text-xs">Amount (₹)</label>
                          <input
                            type="number"
                            step="1"
                            min="0"
                            className="input-field"
                            placeholder="0"
                            value={inc.amount}
                            onChange={(e) => updateIncome(i, "amount", e.target.value)}
                          />
                        </div>
                        <button
                          type="button"
                          onClick={() => removeIncome(i)}
                          className="btn btn-ghost sm:mb-[2px] w-full sm:w-auto mt-2 sm:mt-0 p-3"
                          style={{ color: "var(--color-error)", background: "rgba(239, 83, 80, 0.05)" }}
                        >
                          ✕ Remove
                        </button>
                      </div>
                    ))}
                  </div>

                  {incomes.length > 0 && (
                    <div
                      className="flex justify-between items-center pt-4 mt-2"
                      style={{ borderTop: "1px solid var(--border)" }}
                    >
                      <span
                        className="text-sm font-semibold uppercase tracking-wider"
                        style={{ color: "var(--text-secondary)" }}
                      >
                        Total Income
                      </span>
                      <span className="text-xl font-bold text-[var(--color-success)]">
                        + ₹{totalIncome.toLocaleString()}
                      </span>
                    </div>
                  )}
                </div>

                {(totalIncome > 0 || totalExpense > 0) && (
                  <div
                    className="flex justify-between items-center pt-4 mt-6 p-4 rounded-xl"
                    style={{ background: "var(--color-surface)", border: "2px solid var(--border)" }}
                  >
                    <span
                      className="font-bold tracking-wider"
                      style={{ color: "var(--text-secondary)" }}
                    >
                      NET PROFIT
                    </span>
                    <span className="text-3xl font-bold" style={{ color: (totalIncome - totalExpense) >= 0 ? "var(--color-success)" : "var(--color-error)" }}>
                      ₹{(totalIncome - totalExpense).toLocaleString()}
                    </span>
                  </div>
                )}

                <div className="flex justify-between items-center pt-6 mt-4" style={{ borderTop: "1px solid var(--border)" }}>
                  <button
                    type="button"
                    onClick={() => setStep(2)}
                    className="btn btn-ghost"
                  >
                    ← Back
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="btn btn-primary btn-lg px-10 shadow-lg"
                    id="submit-log-btn"
                  >
                    {isSubmitting ? "Saving..." : "✅ Save Log Entry"}
                  </button>
                </div>
              </div>
            )}
          </form>
        </div>
      </div>
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
