import type { DomainActivity, DomainMetric } from '../../internal/domain.js';
export type TablePreset = {
    id?: string;
    name: string;
    owner: string;
    columnCount: number;
    pageSize: number;
    updatedAt: string;
    status: "draft" | "active" | "shared" | "archived";
};
export type TablePresetStatus = TablePreset['status'];
export interface TablePresetActivity extends DomainActivity {
    tablepresetId?: string;
}
export type TablePresetMetric = Omit<DomainMetric, 'id'> & {
    id: 'totalTablePreset' | 'activeTablePreset' | 'valueTablePreset';
};
export type TablePresetSettingsValues = Partial<Record<"notifyTablePreset" | "archiveTablePreset" | "approveTablePreset", boolean>>;
