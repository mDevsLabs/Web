import type { DomainActivity, DomainMetric } from '../../internal/domain.js';
export type Nutrition = {
    id?: string;
    meal: string;
    food: string;
    calories: number;
    proteinGrams: number;
    status: "planned" | "logged" | "archived";
};
export type NutritionStatus = Nutrition['status'];
export interface NutritionActivity extends DomainActivity {
    nutritionId?: string;
}
export type NutritionMetric = Omit<DomainMetric, 'id'> & {
    id: 'totalNutrition' | 'activeNutrition' | 'valueNutrition';
};
export type NutritionSettingsValues = Partial<Record<"notifyNutrition" | "archiveNutrition" | "approveNutrition", boolean>>;
