import type { DomainActivity, DomainMetric } from '../../internal/domain.js';
export type Recipe = {
    id?: string;
    title: string;
    author: string;
    prepMinutes: number;
    servings: number;
    status: "draft" | "published" | "archived";
};
export type RecipeStatus = Recipe['status'];
export interface RecipeActivity extends DomainActivity {
    recipeId?: string;
}
export type RecipeMetric = Omit<DomainMetric, 'id'> & {
    id: 'totalRecipe' | 'activeRecipe' | 'valueRecipe';
};
export type RecipeSettingsValues = Partial<Record<"notifyRecipe" | "archiveRecipe" | "approveRecipe", boolean>>;
