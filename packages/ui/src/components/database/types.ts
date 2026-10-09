import type { DomainActivity, DomainMetric } from '../../internal/domain.js';
export type Database = {
    id?: string;
    name: string;
    engine: string;
    sizeGb: number;
    connectionCount: number;
    status: "healthy" | "degraded" | "offline";
};
export type DatabaseStatus = Database['status'];
export interface DatabaseActivity extends DomainActivity {
    databaseId?: string;
}
export type DatabaseMetric = Omit<DomainMetric, 'id'> & {
    id: 'totalDatabase' | 'activeDatabase' | 'valueDatabase';
};
export type DatabaseSettingsValues = Partial<Record<"notifyDatabase" | "archiveDatabase" | "approveDatabase", boolean>>;
