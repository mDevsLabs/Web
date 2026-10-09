import type { DomainActivity, DomainMetric } from '../../internal/domain.js';
export type LeaveRequest = {
    id?: string;
    employee: string;
    leaveType: string;
    startDate: string;
    endDate: string;
    status: "pending" | "approved" | "rejected";
};
export type LeaveRequestStatus = LeaveRequest['status'];
export interface LeaveRequestActivity extends DomainActivity {
    leaverequestId?: string;
}
export type LeaveRequestMetric = Omit<DomainMetric, 'id'> & {
    id: 'totalLeaveRequest' | 'activeLeaveRequest' | 'valueLeaveRequest';
};
export type LeaveRequestSettingsValues = Partial<Record<"notifyLeaveRequest" | "archiveLeaveRequest" | "approveLeaveRequest", boolean>>;
