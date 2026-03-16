
export enum AppScreen {
  SPLASH = 'SPLASH',
  ONBOARDING = 'ONBOARDING',
  DASHBOARD = 'DASHBOARD',
  CAMERA = 'CAMERA',
  ANALYSIS = 'ANALYSIS',
  PROFILE = 'PROFILE',
  STATS = 'STATS',
  PLANS = 'PLANS',
  SETTINGS = 'SETTINGS'
}

export type Gender = 'male' | 'female';

export interface UserProfile {
  name: string;
  avatar: string;
  weight: number | '';
  height: number | '';
  age: number | '';
  gender: Gender;
  activityLevel: number; // e.g., 1.2, 1.375, 1.55
}

export interface Ingredient {
  name: string;
  serving: string;
  calories: number;
  match: number;
}

export interface MealAnalysis {
  name: string;
  totalCalories: number;
  protein: number;
  carbs: number;
  fats: number;
  ingredients: Ingredient[];
  imageUrl?: string;
}

export interface MealHistoryItem extends MealAnalysis {
  id: string;
  time: string;
  image: string;
  status: 'AI RECOGNIZED' | 'VERIFIED';
}

export interface MealPlan {
  id: string;
  title: string;
  desc: string;
  kcalModifier: number; // Offset from TDEE
  proteinPct: number;
  carbsPct: number;
  fatsPct: number;
  image: string;
  dynamicKcal?: number; // Calculated field
}
