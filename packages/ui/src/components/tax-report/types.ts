import type { DomainActivity, DomainMetric } from '../../internal/domain.js';
export type TaxReport = {
    id?: string;
    period: string;
    organization: string;
    taxableAmount: number;
    dueDate: string;
    status: "draft" | "submitted" | "accepted";
};
export type TaxReportStatus = TaxReport['status'];
export interface TaxReportActivity extends DomainActivity {
    taxreportId?: string;
}
export type TaxReportMetric = Omit<DomainMetric, 'id'> & {
    id: 'totalTaxReport' | 'activeTaxReport' | 'valueTaxReport';
};
export type TaxReportSettingsValues = Partial<Record<"notifyTaxReport" | "archiveTaxReport" | "approveTaxReport", boolean>>;
