import type { Token } from "./types";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

class ApiClient {
  private baseUrl: string;

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl;
  }

  private getToken(): string | null {
    if (typeof window === "undefined") return null;
    return localStorage.getItem("farmpilot_token");
  }

  private setToken(token: string): void {
    if (typeof window !== "undefined") {
      localStorage.setItem("farmpilot_token", token);
    }
  }

  clearToken(): void {
    if (typeof window !== "undefined") {
      localStorage.removeItem("farmpilot_token");
    }
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const token = this.getToken();
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
      ...(options.headers as Record<string, string>),
    };

    if (token) {
      headers["Authorization"] = `Bearer ${token}`;
    }

    const response = await fetch(`${this.baseUrl}${endpoint}`, {
      ...options,
      headers,
    });

    if (response.status === 204) {
      return undefined as T;
    }

    if (!response.ok) {
      const error = await response.json().catch(() => ({ detail: "Request failed" }));
      throw new ApiError(response.status, error.detail || "Request failed");
    }

    return response.json();
  }

  // --- Auth ---
  async register(data: { email: string; password: string; full_name: string; phone?: string }): Promise<Token> {
    const token = await this.request<Token>("/api/auth/register", {
      method: "POST",
      body: JSON.stringify(data),
    });
    this.setToken(token.access_token);
    return token;
  }

  async login(email: string, password: string): Promise<Token> {
    const token = await this.request<Token>("/api/auth/login", {
      method: "POST",
      body: JSON.stringify({ email, password }),
    });
    this.setToken(token.access_token);
    return token;
  }

  // --- Users ---
  async getProfile() {
    return this.request<import("./types").UserProfile>("/api/users/me");
  }

  async updateProfile(data: import("./types").UserProfileUpdate) {
    return this.request<import("./types").UserProfile>("/api/users/me", {
      method: "PUT",
      body: JSON.stringify(data),
    });
  }

  // --- Lands ---
  async getLands() {
    return this.request<import("./types").Land[]>("/api/lands");
  }

  async createLand(data: import("./types").LandCreate) {
    return this.request<import("./types").Land>("/api/lands", {
      method: "POST",
      body: JSON.stringify(data),
    });
  }

  async getLand(id: string) {
    return this.request<import("./types").Land>(`/api/lands/${id}`);
  }

  async updateLand(id: string, data: import("./types").LandUpdate) {
    return this.request<import("./types").Land>(`/api/lands/${id}`, {
      method: "PUT",
      body: JSON.stringify(data),
    });
  }

  async deleteLand(id: string) {
    return this.request<void>(`/api/lands/${id}`, { method: "DELETE" });
  }

  // --- Sections ---
  async getSections(landId: string) {
    return this.request<import("./types").Section[]>(`/api/lands/${landId}/sections`);
  }

  async createSection(landId: string, data: import("./types").SectionCreate) {
    return this.request<import("./types").Section>(`/api/lands/${landId}/sections`, {
      method: "POST",
      body: JSON.stringify(data),
    });
  }

  async updateSection(sectionId: string, data: import("./types").SectionUpdate) {
    return this.request<import("./types").Section>(`/api/lands/sections/${sectionId}`, {
      method: "PUT",
      body: JSON.stringify(data),
    });
  }

  async deleteSection(sectionId: string) {
    return this.request<void>(`/api/lands/sections/${sectionId}`, { method: "DELETE" });
  }

  // --- Crops ---
  async getCrops() {
    return this.request<import("./types").Crop[]>("/api/crops");
  }

  async createCrop(data: { name: string; variety?: string; season?: string; growth_duration_days?: number; icon_emoji?: string }) {
    return this.request<import("./types").Crop>("/api/crops", {
      method: "POST",
      body: JSON.stringify(data),
    });
  }

  // --- Daily Logs ---
  async getDailyLogs(sectionId: string, dateFrom?: string, dateTo?: string) {
    const params = new URLSearchParams();
    if (dateFrom) params.set("date_from", dateFrom);
    if (dateTo) params.set("date_to", dateTo);
    const query = params.toString() ? `?${params.toString()}` : "";
    return this.request<import("./types").DailyLog[]>(`/api/sections/${sectionId}/logs${query}`);
  }

  async createDailyLog(sectionId: string, data: import("./types").DailyLogCreate) {
    return this.request<import("./types").DailyLog>(`/api/sections/${sectionId}/logs`, {
      method: "POST",
      body: JSON.stringify(data),
    });
  }

  async getDailyLog(logId: string) {
    return this.request<import("./types").DailyLog>(`/api/logs/${logId}`);
  }

  async deleteDailyLog(logId: string) {
    return this.request<void>(`/api/logs/${logId}`, { method: "DELETE" });
  }

  async addExpense(logId: string, data: import("./types").ExpenseCreate) {
    return this.request<import("./types").Expense>(`/api/logs/${logId}/expenses`, {
      method: "POST",
      body: JSON.stringify(data),
    });
  }
}

export class ApiError extends Error {
  status: number;
  constructor(status: number, message: string) {
    super(message);
    this.status = status;
    this.name = "ApiError";
  }
}

export const api = new ApiClient(API_BASE);
