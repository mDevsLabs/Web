import type { DomainActivity, DomainMetric } from '../../internal/domain.js';
export type Venue = {
    id?: string;
    name: string;
    city: string;
    capacity: number;
    dailyRate: number;
    status: "available" | "booked" | "closed";
};
export type VenueStatus = Venue['status'];
export interface VenueActivity extends DomainActivity {
    venueId?: string;
}
export type VenueMetric = Omit<DomainMetric, 'id'> & {
    id: 'totalVenue' | 'activeVenue' | 'valueVenue';
};
export type VenueSettingsValues = Partial<Record<"notifyVenue" | "archiveVenue" | "approveVenue", boolean>>;
