import type { DomainActivity, DomainMetric } from '../../internal/domain.js';
export type Server = {
    id?: string;
    name: string;
    region: string;
    cpuPercent: number;
    memoryGb: number;
    status: "online" | "offline" | "maintenance";
};
export type ServerStatus = Server['status'];
export interface ServerActivity extends DomainActivity {
    serverId?: string;
}
export type ServerMetric = Omit<DomainMetric, 'id'> & {
    id: 'totalServer' | 'activeServer' | 'valueServer';
};
export type ServerSettingsValues = Partial<Record<"notifyServer" | "archiveServer" | "approveServer", boolean>>;
