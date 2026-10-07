// Generated from scripts/data/domains.txt. One independent export and data contract per module.
'use client';
import { DomainCard, type DomainFrameProps } from '../../internal/domain.js';
import { config } from './config.js';
import type { TaxReport, TaxReportStatus, TaxReportActivity, TaxReportMetric, TaxReportSettingsValues } from './types.js';
export interface TaxReportCardProps extends Omit<DomainFrameProps, 'children' | 'onSelect' | 'onChange' | 'onSubmit'> {
    item: TaxReport;
}
export function TaxReportCard(props: TaxReportCardProps) { return <DomainCard config={config} {...props}/>; }
