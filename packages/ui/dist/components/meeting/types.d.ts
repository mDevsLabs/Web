import type { DomainActivity, DomainMetric } from '../../internal/domain.js';
export type Meeting = {
    id?: string;
    title: string;
    host: string;
    scheduledOn: string;
    durationMinutes: number;
    status: "scheduled" | "ongoing" | "completed" | "cancelled";
};
export type MeetingStatus = Meeting['status'];
export interface MeetingActivity extends DomainActivity {
    meetingId?: string;
}
export type MeetingMetric = Omit<DomainMetric, 'id'> & {
    id: 'totalMeeting' | 'activeMeeting' | 'valueMeeting';
};
export type MeetingSettingsValues = Partial<Record<"notifyMeeting" | "archiveMeeting" | "approveMeeting", boolean>>;
