"use client";

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
import type { AnalyticsResponse } from "@/lib/types";

const COLORS = ["#40916c", "#52b788", "#74c69d", "#95d5b2", "#b7e4c7", "#d8f3dc"];
const PIE_COLORS = ["#ff9f1c", "#ffbf69", "#cbf3f0", "#2ec4b6", "#e76f51", "#f4a261", "#e9c46a"];

export function RevenueExpensesChart({ data, year }: { data: AnalyticsResponse, year: number }) {
  if (data.monthly_data.length === 0) {
    return (
      <div className="h-[350px] flex items-center justify-center text-sm" style={{ color: "var(--text-muted)" }}>
        No financial data logged for this year.
      </div>
    );
  }

  return (
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
  );
}

export function ExpenseBreakdownChart({ data }: { data: AnalyticsResponse }) {
  const expenseData = Object.keys(data.expense_breakdown).map((key) => ({
    name: key.replace("_", " ").charAt(0).toUpperCase() + key.replace("_", " ").slice(1),
    value: data.expense_breakdown[key],
  })).sort((a, b) => b.value - a.value);

  if (expenseData.length === 0) {
    return (
      <div className="h-[300px] flex items-center justify-center text-sm" style={{ color: "var(--text-muted)" }}>
        No expenses logged.
      </div>
    );
  }

  return (
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
          >
            {expenseData.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} stroke="transparent" />
            ))}
          </Pie>
          <Tooltip 
            contentStyle={{ borderRadius: "12px", border: "none", boxShadow: "0 10px 25px rgba(0,0,0,0.1)", background: "var(--color-surface)" }}
            formatter={(value: any) => [`₹${Number(value).toLocaleString()}`, undefined]}
          />
          <Legend iconType="circle" layout="vertical" verticalAlign="middle" align="right" />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}
