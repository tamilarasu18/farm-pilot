"use client";

import { useState } from "react";
import dynamic from "next/dynamic";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";

// Dynamically import charts so they don't block the initial page load
const RevenueExpensesChart = dynamic(
  () => import("./Charts").then((mod) => mod.RevenueExpensesChart),
  { ssr: false, loading: () => <div className="h-[350px] w-full skeleton rounded-xl" /> }
);

const ExpenseBreakdownChart = dynamic(
  () => import("./Charts").then((mod) => mod.ExpenseBreakdownChart),
  { ssr: false, loading: () => <div className="h-[300px] w-full skeleton rounded-xl" /> }
);

export default function AnalyticsPage() {
  const [year, setYear] = useState<number>(new Date().getFullYear());

  const { data, isLoading, error } = useQuery({
    queryKey: ["analytics", year],
    queryFn: () => api.getFinancialAnalytics(year),
  });

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
        {error instanceof Error ? error.message : "Failed to load analytics."}
      </div>
    );
  }

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
          {[0, 1, 2, 3, 4].map((offset) => {
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
          <RevenueExpensesChart data={data} year={year} />
        </div>

        {/* Expense Breakdown Pie Chart */}
        <div className="card">
          <h3 className="font-bold text-lg mb-6 text-[var(--foreground)]">Expense Breakdown</h3>
          <ExpenseBreakdownChart data={data} />
        </div>
      </div>
    </div>
  );
}
