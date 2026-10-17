import type { DomainActivity, DomainMetric } from '../../internal/domain.js';
export type AlertRule = {
    id?: string;
    name: string;
    metric: string;
    threshold: number;
    channel: string;
    status: "active" | "muted" | "disabled";
};
export type AlertRuleStatus = AlertRule['status'];
export interface AlertRuleActivity extends DomainActivity {
    alertruleId?: string;
}
export type AlertRuleMetric = Omit<DomainMetric, 'id'> & {
    id: 'totalAlertRule' | 'activeAlertRule' | 'valueAlertRule';
};
export type AlertRuleSettingsValues = Partial<Record<"notifyAlertRule" | "archiveAlertRule" | "approveAlertRule", boolean>>;
