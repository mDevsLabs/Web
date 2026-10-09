import type { DomainActivity, DomainMetric } from '../../internal/domain.js';
export type Event = {
    id?: string;
    title: string;
    location: string;
    startsOn: string;
    attendeeCount: number;
    status: "draft" | "scheduled" | "cancelled" | "completed";
};
export type EventStatus = Event['status'];
export interface EventActivity extends DomainActivity {
    eventId?: string;
}
export type EventMetric = Omit<DomainMetric, 'id'> & {
    id: 'totalEvent' | 'activeEvent' | 'valueEvent';
};
export type EventSettingsValues = Partial<Record<"notifyEvent" | "archiveEvent" | "approveEvent", boolean>>;
