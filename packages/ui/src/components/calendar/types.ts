import type { DomainActivity, DomainMetric } from '../../internal/domain.js';
export type Calendar = {
    id?: string;
    name: string;
    owner: string;
    eventCount: number;
    timeZone: string;
    status: "active" | "shared" | "private";
};
export type CalendarStatus = Calendar['status'];
export interface CalendarActivity extends DomainActivity {
    calendarId?: string;
}
export type CalendarMetric = Omit<DomainMetric, 'id'> & {
    id: 'totalCalendar' | 'activeCalendar' | 'valueCalendar';
};
export type CalendarSettingsValues = Partial<Record<"notifyCalendar" | "archiveCalendar" | "approveCalendar", boolean>>;
