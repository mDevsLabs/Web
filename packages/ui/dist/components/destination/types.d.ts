import type { DomainActivity, DomainMetric } from '../../internal/domain.js';
export type Destination = {
    id?: string;
    name: string;
    country: string;
    averageCost: number;
    rating: number;
    status: "featured" | "available" | "seasonal";
};
export type DestinationStatus = Destination['status'];
export interface DestinationActivity extends DomainActivity {
    destinationId?: string;
}
export type DestinationMetric = Omit<DomainMetric, 'id'> & {
    id: 'totalDestination' | 'activeDestination' | 'valueDestination';
};
export type DestinationSettingsValues = Partial<Record<"notifyDestination" | "archiveDestination" | "approveDestination", boolean>>;
