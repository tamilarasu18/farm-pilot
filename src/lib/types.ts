/* === TypeScript Types for FarmPilot === */

// --- Auth ---
export interface UserRegister {
  email: string;
  password: string;
  full_name: string;
  phone?: string;
}

export interface UserLogin {
  email: string;
  password: string;
}

export interface Token {
  access_token: string;
  token_type: string;
}

// --- User ---
export interface UserProfile {
  id: string;
  email: string;
  full_name: string;
  phone: string | null;
  address: string | null;
  profile_image_url: string | null;
  created_at: string;
  updated_at: string;
}

export interface UserProfileUpdate {
  full_name?: string;
  phone?: string;
  address?: string;
  profile_image_url?: string;
}

// --- Land ---
export interface Point {
  x: number;
  y: number;
  curve?: number; // 0-100, curvature percentage for the edge arriving at this point
}

export interface LandCreate {
  name: string;
  address?: string;
  total_area_acres?: number;
}

export interface LandUpdate {
  name?: string;
  address?: string;
  total_area_acres?: number;
  boundary_points?: Point[];
  canvas_metadata?: Record<string, unknown>;
}

export interface Land {
  id: string;
  user_id: string;
  name: string;
  total_area_acres: number | null;
  boundary_points: Point[] | null;
  canvas_metadata: Record<string, unknown> | null;
  address: string | null;
  sections_count: number;
  created_at: string;
  updated_at: string;
}

// --- Sections ---
export interface SectionCreate {
  name: string;
  color?: string;
  area_acres?: number;
  boundary_points?: Point[];
  current_crop_id?: string;
}

export interface SectionUpdate {
  name?: string;
  color?: string;
  area_acres?: number;
  boundary_points?: Point[];
  current_crop_id?: string;
}

export interface Section {
  id: string;
  land_id: string;
  name: string;
  color: string;
  area_acres: number | null;
  boundary_points: Point[] | null;
  current_crop_id: string | null;
  crop_name: string | null;
  crop_emoji: string | null;
  created_at: string;
}

// --- Crops ---
export interface Crop {
  id: string;
  name: string;
  variety: string | null;
  season: string | null;
  growth_duration_days: number | null;
  icon_emoji: string;
}

export interface CropCreate {
  name: string;
  variety?: string;
  season?: string;
  growth_duration_days?: number;
  icon_emoji?: string;
}

// --- Daily Logs ---
export interface ExpenseCreate {
  category: string;
  description?: string;
  amount: number;
  currency?: string;
}

export interface Expense {
  id: string;
  daily_log_id: string;
  section_id: string;
  category: string;
  description: string | null;
  amount: number;
  currency: string;
  created_at: string;
}

export interface DailyLogCreate {
  log_date: string;
  activity_type: string;
  notes?: string;
  temperature_c?: number;
  humidity_pct?: number;
  rainfall_mm?: number;
  weather_condition?: string;
  crop_stage?: string;
  crop_health_notes?: string;
  expenses?: ExpenseCreate[];
  incomes?: IncomeCreate[];
}

export interface DailyLog {
  id: string;
  section_id: string;
  user_id: string;
  log_date: string;
  activity_type: string;
  notes: string | null;
  temperature_c: number | null;
  humidity_pct: number | null;
  rainfall_mm: number | null;
  weather_condition: string | null;
  crop_stage: string | null;
  crop_health_notes: string | null;
  expenses: Expense[];
  incomes: Income[];
  total_expense: number;
  total_income: number;
  created_at: string;
}

export interface IncomeCreate {
  category: string;
  description?: string;
  amount: number;
  currency?: string;
}

export interface Income {
  id: string;
  daily_log_id: string;
  section_id: string;
  category: string;
  description: string | null;
  amount: number;
  currency: string;
  created_at: string;
}

// --- Analytics ---
export interface MonthlyFinancials {
  month: string;
  month_index: number;
  revenue: number;
  expenses: number;
  profit: number;
}

export interface AnalyticsResponse {
  total_revenue: number;
  total_expenses: number;
  net_profit: number;
  monthly_data: MonthlyFinancials[];
  expense_breakdown: Record<string, number>;
}

// --- UI Types ---
export type ActivityType =
  | "planting"
  | "watering"
  | "fertilizing"
  | "weeding"
  | "harvesting"
  | "spraying"
  | "pruning"
  | "inspection"
  | "other";

export type WeatherCondition =
  | "sunny"
  | "cloudy"
  | "rainy"
  | "stormy"
  | "windy"
  | "foggy"
  | "snowy";

export type CropStage =
  | "seedling"
  | "vegetative"
  | "flowering"
  | "fruiting"
  | "harvest-ready"
  | "harvested";

export type ExpenseCategory =
  | "seeds"
  | "fertilizer"
  | "pesticide"
  | "labor"
  | "equipment"
  | "fuel"
  | "water"
  | "transport"
  | "other";

export type IncomeCategory =
  | "harvest_sale"
  | "subsidy"
  | "other";

// --- Soil Tests ---
export interface SoilTestCreate {
  land_id: string;
  section_id?: string;
  test_date: string;
  lab_name?: string;
  sample_depth?: string;
  notes?: string;
  measurement_unit?: string;
  ph_level?: number;
  ec_level?: number;
  organic_carbon?: number;
  nitrogen?: number;
  phosphorus?: number;
  potassium?: number;
  micronutrients?: Record<string, number>;
}

export interface SoilTest {
  id: string;
  user_id: string;
  land_id: string;
  section_id: string | null;
  test_date: string;
  lab_name: string | null;
  sample_depth: string | null;
  notes: string | null;
  measurement_unit: string;
  ph_level: number | null;
  ec_level: number | null;
  organic_carbon: number | null;
  nitrogen: number | null;
  phosphorus: number | null;
  potassium: number | null;
  micronutrients: Record<string, number> | null;
  created_at: string;
}
