import type { DomainActivity, DomainMetric } from '../../internal/domain.js';
export type SleepSession = {
    id?: string;
    title: string;
    date: string;
    durationHours: number;
    qualityScore: number;
    status: "logged" | "reviewed" | "archived";
};
export type SleepSessionStatus = SleepSession['status'];
export interface SleepSessionActivity extends DomainActivity {
    sleepsessionId?: string;
}
export type SleepSessionMetric = Omit<DomainMetric, 'id'> & {
    id: 'totalSleepSession' | 'activeSleepSession' | 'valueSleepSession';
};
export type SleepSessionSettingsValues = Partial<Record<"notifySleepSession" | "archiveSleepSession" | "approveSleepSession", boolean>>;
