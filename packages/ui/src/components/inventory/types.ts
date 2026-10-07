import type { DomainActivity, DomainMetric } from '../../internal/domain.js';
export type Inventory = {
    id?: string;
    itemName: string;
    location: string;
    quantity: number;
    reorderAt: number;
    status: "available" | "low" | "out-of-stock";
};
export type InventoryStatus = Inventory['status'];
export interface InventoryActivity extends DomainActivity {
    inventoryId?: string;
}
export type InventoryMetric = Omit<DomainMetric, 'id'> & {
    id: 'totalInventory' | 'activeInventory' | 'valueInventory';
};
export type InventorySettingsValues = Partial<Record<"notifyInventory" | "archiveInventory" | "approveInventory", boolean>>;
