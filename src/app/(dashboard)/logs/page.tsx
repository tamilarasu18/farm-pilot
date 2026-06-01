"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { api } from "@/lib/api";
import type { Land, Section, DailyLog } from "@/lib/types";

export default function LogsPage() {
  const [lands, setLands] = useState<Land[]>([]);
  const [sections, setSections] = useState<Record<string, Section[]>>({});
  const [logs, setLogs] = useState<DailyLog[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedSection, setSelectedSection] = useState<string>("");

  useEffect(() => {
    const fetchData = async () => {
      try {
        const landsData = await api.getLands();
        setLands(landsData);

        // Fetch sections for all lands
        const sectionsMap: Record<string, Section[]> = {};
        let firstSectionId = "";
        for (const land of landsData) {
          const s = await api.getSections(land.id);
          sectionsMap[land.id] = s;
          if (!firstSectionId && s.length > 0) {
            firstSectionId = s[0].id;
          }
        }
        setSections(sectionsMap);

        if (firstSectionId) {
          setSelectedSection(firstSectionId);
          const logsData = await api.getDailyLogs(firstSectionId);
          setLogs(logsData);
        }
      } catch {
        // handle error
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, []);

  const handleSectionChange = async (sectionId: string) => {
    setSelectedSection(sectionId);
    if (sectionId) {
      const logsData = await api.getDailyLogs(sectionId);
      setLogs(logsData);
    } else {
      setLogs([]);
    }
  };

  const allSections = Object.values(sections).flat();

  const getWeatherIcon = (condition: string | null) => {
    const icons: Record<string, string> = {
      sunny: "☀️",
      cloudy: "☁️",
      rainy: "🌧️",
      stormy: "⛈️",
      windy: "💨",
      foggy: "🌫️",
      snowy: "❄️",
    };
    return condition ? icons[condition] || "🌤️" : "🌤️";
  };

  const getActivityIcon = (type: string) => {
    const icons: Record<string, string> = {
      planting: "🌱",
      watering: "💧",
      fertilizing: "🧪",
      weeding: "🌿",
      harvesting: "🌾",
      spraying: "💊",
      pruning: "✂️",
      inspection: "🔍",
    };
    return icons[type] || "📋";
  };

  if (isLoading) {
    return (
      <div className="animate-fade-in">
        <div className="skeleton h-8 w-48 mb-6" />
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="skeleton h-24 w-full rounded-xl" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="animate-fade-in">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-bold text-[var(--foreground)]">
            Daily Logs
          </h1>
          <p className="text-sm mt-1" style={{ color: "var(--text-secondary)" }}>
            Track your daily farming activities
          </p>
        </div>
        {allSections.length > 0 && (
          <Link
            href={`/logs/new?section=${selectedSection}`}
            className="btn btn-primary"
            id="add-log-btn"
          >
            + New Log Entry
          </Link>
        )}
      </div>

      {/* No lands/sections */}
      {allSections.length === 0 && (
        <div className="text-center py-20">
          <div className="text-6xl mb-4">📋</div>
          <h2 className="text-xl font-semibold text-[var(--foreground)] mb-2">
            No sections to log
          </h2>
          <p className="text-sm mb-6" style={{ color: "var(--text-muted)" }}>
            Create a land and add sections first before logging activities
          </p>
          <Link href="/lands/new" className="btn btn-primary">
            Add Land First
          </Link>
        </div>
      )}

      {allSections.length > 0 && (
        <>
          {/* Section Filter */}
          <div className="mb-6">
            <label htmlFor="log-section-filter" className="input-label">
              Filter by Section
            </label>
            <select
              id="log-section-filter"
              className="input-field"
              style={{ maxWidth: "320px" }}
              value={selectedSection}
              onChange={(e) => handleSectionChange(e.target.value)}
            >
              {lands.map((land) => (
                <optgroup key={land.id} label={`🗺️ ${land.name}`}>
                  {(sections[land.id] || []).map((section) => (
                    <option key={section.id} value={section.id}>
                      {section.crop_emoji || "🌱"} {section.name}
                      {section.crop_name ? ` (${section.crop_name})` : ""}
                    </option>
                  ))}
                </optgroup>
              ))}
            </select>
          </div>

          {/* Logs List */}
          {logs.length === 0 && (
            <div className="text-center py-12">
              <div className="text-5xl mb-4">📝</div>
              <p className="text-sm" style={{ color: "var(--text-muted)" }}>
                No log entries for this section yet
              </p>
            </div>
          )}

          <div className="space-y-3 stagger">
            {logs.map((log) => (
              <div key={log.id} className="card">
                <div className="flex items-start gap-4">
                  {/* Activity icon */}
                  <div
                    className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl shrink-0"
                    style={{ background: "rgba(64, 145, 108, 0.1)" }}
                  >
                    {getActivityIcon(log.activity_type)}
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-semibold text-[var(--foreground)] capitalize">
                        {log.activity_type}
                      </h3>
                      <span className="text-xs" style={{ color: "var(--text-muted)" }}>
                        {new Date(log.log_date).toLocaleDateString("en-IN", {
                          day: "numeric",
                          month: "short",
                          year: "numeric",
                        })}
                      </span>
                    </div>

                    {log.notes && (
                      <p className="text-sm mb-2" style={{ color: "var(--text-secondary)" }}>
                        {log.notes}
                      </p>
                    )}

                    {/* Tags */}
                    <div className="flex flex-wrap gap-2">
                      {log.weather_condition && (
                        <span className="badge">
                          {getWeatherIcon(log.weather_condition)}{" "}
                          {log.weather_condition}
                        </span>
                      )}
                      {log.temperature_c !== null && (
                        <span className="badge">🌡️ {log.temperature_c}°C</span>
                      )}
                      {log.humidity_pct !== null && (
                        <span className="badge">💧 {log.humidity_pct}%</span>
                      )}
                      {log.rainfall_mm !== null && log.rainfall_mm > 0 && (
                        <span className="badge">🌧️ {log.rainfall_mm}mm</span>
                      )}
                      {log.crop_stage && (
                        <span className="badge badge-success">
                          🌱 {log.crop_stage}
                        </span>
                      )}
                      {log.total_expense > 0 && (
                        <span className="badge badge-warning">
                          💰 ₹{log.total_expense.toLocaleString()}
                        </span>
                      )}
                    </div>

                    {/* Expenses breakdown */}
                    {log.expenses.length > 0 && (
                      <div
                        className="mt-3 pt-3 space-y-1"
                        style={{ borderTop: "1px solid var(--border)" }}
                      >
                        {log.expenses.map((exp) => (
                          <div
                            key={exp.id}
                            className="flex justify-between text-xs"
                            style={{ color: "var(--text-muted)" }}
                          >
                            <span className="capitalize">
                              {exp.category}: {exp.description || ""}
                            </span>
                            <span className="font-mono">
                              ₹{exp.amount.toLocaleString()}
                            </span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
