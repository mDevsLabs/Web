import type { DomainActivity, DomainMetric } from '../../internal/domain.js';
export type ApiEndpoint = {
    id?: string;
    path: string;
    method: string;
    latencyMs: number;
    requestCount: number;
    status: "healthy" | "degraded" | "disabled";
};
export type ApiEndpointStatus = ApiEndpoint['status'];
export interface ApiEndpointActivity extends DomainActivity {
    apiendpointId?: string;
}
export type ApiEndpointMetric = Omit<DomainMetric, 'id'> & {
    id: 'totalApiEndpoint' | 'activeApiEndpoint' | 'valueApiEndpoint';
};
export type ApiEndpointSettingsValues = Partial<Record<"notifyApiEndpoint" | "archiveApiEndpoint" | "approveApiEndpoint", boolean>>;
