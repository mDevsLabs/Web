// Generated from scripts/data/domains.txt. One independent export and data contract per module.
'use client';
import { DomainOverview, type DomainFrameProps } from '../../internal/domain.js';
import { config } from './config.js';
import type { TaxReport, TaxReportStatus, TaxReportActivity, TaxReportMetric, TaxReportSettingsValues } from './types.js';
export interface TaxReportOverviewProps extends Omit<DomainFrameProps, 'children' | 'onSelect' | 'onChange' | 'onSubmit'> {
    items: readonly TaxReport[];
    metrics: readonly TaxReportMetric[];
}
export function TaxReportOverview(props: TaxReportOverviewProps) { return <DomainOverview config={config} {...props}/>; }
