// Generated from scripts/data/domains.txt. One independent export and data contract per module.
'use client';
import { DomainList, type DomainFrameProps } from '../../internal/domain.js';
import { config } from './config.js';
import type { TaxReport, TaxReportStatus, TaxReportActivity, TaxReportMetric, TaxReportSettingsValues } from './types.js';
export interface TaxReportListProps extends Omit<DomainFrameProps, 'children' | 'onSelect' | 'onChange' | 'onSubmit'> {
    items: readonly TaxReport[];
    onSelect?: (item: TaxReport) => void;
    emptyMessage?: string;
}
export function TaxReportList({ onSelect, ...props }: TaxReportListProps) { return <DomainList config={config} {...props} onSelect={onSelect ? item => onSelect(item as TaxReport) : undefined}/>; }
