import type { DomainActivity, DomainMetric } from '../../internal/domain.js';
export type Warehouse = {
    id?: string;
    name: string;
    city: string;
    capacity: number;
    occupancy: number;
    status: "active" | "maintenance" | "closed";
};
export type WarehouseStatus = Warehouse['status'];
export interface WarehouseActivity extends DomainActivity {
    warehouseId?: string;
}
export type WarehouseMetric = Omit<DomainMetric, 'id'> & {
    id: 'totalWarehouse' | 'activeWarehouse' | 'valueWarehouse';
};
export type WarehouseSettingsValues = Partial<Record<"notifyWarehouse" | "archiveWarehouse" | "approveWarehouse", boolean>>;
