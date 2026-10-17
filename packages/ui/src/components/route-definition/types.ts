import type { DomainActivity, DomainMetric } from '../../internal/domain.js';
export type RouteDefinition = {
    id?: string;
    name: string;
    path: string;
    section: string;
    priority: number;
    updatedAt: string;
    status: "draft" | "active" | "hidden" | "retired";
};
export type RouteDefinitionStatus = RouteDefinition['status'];
export interface RouteDefinitionActivity extends DomainActivity {
    routedefinitionId?: string;
}
export type RouteDefinitionMetric = Omit<DomainMetric, 'id'> & {
    id: 'totalRouteDefinition' | 'activeRouteDefinition' | 'valueRouteDefinition';
};
export type RouteDefinitionSettingsValues = Partial<Record<"notifyRouteDefinition" | "archiveRouteDefinition" | "approveRouteDefinition", boolean>>;
