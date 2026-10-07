import type { DomainActivity, DomainMetric } from '../../internal/domain.js';
export type Monitor = {
    id?: string;
    name: string;
    url: string;
    uptimePercent: number;
    intervalSeconds: number;
    status: "up" | "down" | "paused";
};
export type MonitorStatus = Monitor['status'];
export interface MonitorActivity extends DomainActivity {
    monitorId?: string;
}
export type MonitorMetric = Omit<DomainMetric, 'id'> & {
    id: 'totalMonitor' | 'activeMonitor' | 'valueMonitor';
};
export type MonitorSettingsValues = Partial<Record<"notifyMonitor" | "archiveMonitor" | "approveMonitor", boolean>>;
