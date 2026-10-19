import type { DomainActivity, DomainMetric } from '../../internal/domain.js';
export type RestaurantMenu = {
    id?: string;
    name: string;
    restaurant: string;
    dishCount: number;
    averagePrice: number;
    status: "draft" | "active" | "seasonal";
};
export type RestaurantMenuStatus = RestaurantMenu['status'];
export interface RestaurantMenuActivity extends DomainActivity {
    restaurantmenuId?: string;
}
export type RestaurantMenuMetric = Omit<DomainMetric, 'id'> & {
    id: 'totalRestaurantMenu' | 'activeRestaurantMenu' | 'valueRestaurantMenu';
};
export type RestaurantMenuSettingsValues = Partial<Record<"notifyRestaurantMenu" | "archiveRestaurantMenu" | "approveRestaurantMenu", boolean>>;
