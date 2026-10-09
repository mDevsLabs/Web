import type { DomainActivity, DomainMetric } from '../../internal/domain.js';
export type Shift = {
    id?: string;
    name: string;
    employee: string;
    scheduledOn: string;
    hours: number;
    status: "planned" | "confirmed" | "completed";
};
export type ShiftStatus = Shift['status'];
export interface ShiftActivity extends DomainActivity {
    shiftId?: string;
}
export type ShiftMetric = Omit<DomainMetric, 'id'> & {
    id: 'totalShift' | 'activeShift' | 'valueShift';
};
export type ShiftSettingsValues = Partial<Record<"notifyShift" | "archiveShift" | "approveShift", boolean>>;
