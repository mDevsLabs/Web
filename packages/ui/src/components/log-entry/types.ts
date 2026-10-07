import type { DomainActivity, DomainMetric } from '../../internal/domain.js';
export type LogEntry = {
    id?: string;
    message: string;
    service: string;
    timestamp: string;
    occurrences: number;
    status: "info" | "warning" | "error";
};
export type LogEntryStatus = LogEntry['status'];
export interface LogEntryActivity extends DomainActivity {
    logentryId?: string;
}
export type LogEntryMetric = Omit<DomainMetric, 'id'> & {
    id: 'totalLogEntry' | 'activeLogEntry' | 'valueLogEntry';
};
export type LogEntrySettingsValues = Partial<Record<"notifyLogEntry" | "archiveLogEntry" | "approveLogEntry", boolean>>;
