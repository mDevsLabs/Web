import type { DomainActivity, DomainMetric } from '../../internal/domain.js';
export type SavedFilter = {
    id?: string;
    name: string;
    query: string;
    owner: string;
    resultCount: number;
    updatedAt: string;
    status: "draft" | "active" | "shared" | "archived";
};
export type SavedFilterStatus = SavedFilter['status'];
export interface SavedFilterActivity extends DomainActivity {
    savedfilterId?: string;
}
export type SavedFilterMetric = Omit<DomainMetric, 'id'> & {
    id: 'totalSavedFilter' | 'activeSavedFilter' | 'valueSavedFilter';
};
export type SavedFilterSettingsValues = Partial<Record<"notifySavedFilter" | "archiveSavedFilter" | "approveSavedFilter", boolean>>;
