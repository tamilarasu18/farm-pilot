"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import type { AnalyticsResponse } from "@/lib/types";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts";

const COLORS = ["#40916c", "#52b788", "#74c69d", "#95d5b2", "#b7e4c7", "#d8f3dc"];
const PIE_COLORS = ["#ff9f1c", "#ffbf69", "#cbf3f0", "#2ec4b6", "#e76f51", "#f4a261", "#e9c46a"];

export default function AnalyticsPage() {
  const [data, setData] = useState<AnalyticsResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [year, setYear] = useState<number>(new Date().getFullYear());

  useEffect(() => {
    const fetchAnalytics = async () => {
      setIsLoading(true);
      try {
        const result = await api.getFinancialAnalytics(year);
        setData(result);
      } catch {
        setError("Failed to load analytics.");
      } finally {
        setIsLoading(false);
      }
    };
    fetchAnalytics();
  }, [year]);

  if (isLoading) {
    return (
      <div className="max-w-6xl mx-auto space-y-6">
        <div className="skeleton h-12 w-48" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="skeleton h-32 w-full rounded-2xl" />
          <div className="skeleton h-32 w-full rounded-2xl" />
          <div className="skeleton h-32 w-full rounded-2xl" />
        </div>
        <div className="skeleton h-96 w-full rounded-2xl" />
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="p-4 rounded-xl text-center" style={{ background: "rgba(239, 83, 80, 0.1)", color: "var(--color-error)" }}>
        {error || "No data available."}
      </div>
    );
  }

  // Format expense breakdown for pie chart
  const expenseData = Object.keys(data.expense_breakdown).map((key) => ({
    name: key.replace("_", " ").charAt(0).toUpperCase() + key.replace("_", " ").slice(1),
    value: data.expense_breakdown[key],
  })).sort((a, b) => b.value - a.value);

  const isProfitable = data.net_profit >= 0;

  return (
    <div className="max-w-6xl mx-auto animate-fade-in space-y-8">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-[var(--foreground)]">Financial Analytics</h1>
          <p className="text-sm mt-2" style={{ color: "var(--text-secondary)" }}>
            Track your farm's revenue, expenses, and profitability.
          </p>
        </div>
        <select
          className="input-field !w-32"
          value={year}
          onChange={(e) => setYear(parseInt(e.target.value))}
        >
          {[0, 1, 2, 3, 4].map(offset => {
            const y = new Date().getFullYear() - offset;
            return <option key={y} value={y}>{y}</option>;
          })}
        </select>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="card shadow-lg" style={{ borderTop: "4px solid var(--color-success)" }}>
          <p className="text-sm font-semibold mb-1" style={{ color: "var(--text-secondary)" }}>TOTAL REVENUE</p>
          <h2 className="text-3xl font-bold text-[var(--foreground)]">₹{data.total_revenue.toLocaleString()}</h2>
        </div>
        <div className="card shadow-lg" style={{ borderTop: "4px solid var(--color-error)" }}>
          <p className="text-sm font-semibold mb-1" style={{ color: "var(--text-secondary)" }}>TOTAL EXPENSES</p>
          <h2 className="text-3xl font-bold text-[var(--foreground)]">₹{data.total_expenses.toLocaleString()}</h2>
        </div>
        <div className="card shadow-lg" style={{ borderTop: `4px solid ${isProfitable ? "var(--color-success)" : "var(--color-error)"}` }}>
          <p className="text-sm font-semibold mb-1" style={{ color: "var(--text-secondary)" }}>NET PROFIT</p>
          <h2 className="text-3xl font-bold" style={{ color: isProfitable ? "var(--color-success)" : "var(--color-error)" }}>
            {isProfitable ? "+" : ""}₹{data.net_profit.toLocaleString()}
          </h2>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Bar Chart */}
        <div className="lg:col-span-2 card">
          <h3 className="font-bold text-lg mb-6 text-[var(--foreground)]">Revenue vs. Expenses ({year})</h3>
          {data.monthly_data.length === 0 ? (
            <div className="h-[350px] flex items-center justify-center text-sm" style={{ color: "var(--text-muted)" }}>
              No financial data logged for this year.
            </div>
          ) : (
            <div className="h-[350px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={data.monthly_data} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" opacity={0.2} vertical={false} />
                  <XAxis dataKey="month" tick={{ fill: "var(--text-secondary)" }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fill: "var(--text-secondary)" }} axisLine={false} tickLine={false} tickFormatter={(val) => `₹${val/1000}k`} />
                  <Tooltip 
                    cursor={{ fill: "rgba(0,0,0,0.05)" }}
                    contentStyle={{ borderRadius: "12px", border: "none", boxShadow: "0 10px 25px rgba(0,0,0,0.1)", background: "var(--color-surface)" }}
                    formatter={(value: any) => [`₹${Number(value).toLocaleString()}`, undefined]}
                  />
                  <Legend iconType="circle" />
                  <Bar dataKey="revenue" name="Revenue" fill="var(--color-success)" radius={[4, 4, 0, 0]} maxBarSize={40} />
                  <Bar dataKey="expenses" name="Expenses" fill="var(--color-error)" radius={[4, 4, 0, 0]} maxBarSize={40} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>

        {/* Expense Breakdown Pie Chart */}
        <div className="card">
          <h3 className="font-bold text-lg mb-6 text-[var(--foreground)]">Expense Breakdown</h3>
          {expenseData.length === 0 ? (
            <div className="h-[300px] flex items-center justify-center text-sm" style={{ color: "var(--text-muted)" }}>
              No expenses logged.
            </div>
          ) : (
            <div className="h-[300px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={expenseData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={90}
                    paddingAngle={5}
                    dataKey="value"
                    stroke="none"
                  >
                    {expenseData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip 
                    contentStyle={{ borderRadius: "12px", border: "none", boxShadow: "0 10px 25px rgba(0,0,0,0.1)", background: "var(--surface)" }}
                    formatter={(value: any) => [`₹${Number(value).toLocaleString()}`, undefined]}
                  />
                </PieChart>
              </ResponsiveContainer>
              <div className="mt-4 space-y-2">
                {expenseData.slice(0, 4).map((exp, idx) => (
                  <div key={exp.name} className="flex justify-between items-center text-sm">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full" style={{ background: PIE_COLORS[idx % PIE_COLORS.length] }} />
                      <span style={{ color: "var(--text-secondary)" }}>{exp.name}</span>
                    </div>
                    <span className="font-semibold text-[var(--foreground)]">₹{exp.value.toLocaleString()}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
