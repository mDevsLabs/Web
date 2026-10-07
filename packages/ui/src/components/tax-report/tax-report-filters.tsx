// Generated from scripts/data/domains.txt. One independent export and data contract per module.
'use client';
import { DomainFilters, type DomainFrameProps } from '../../internal/domain.js';
import { config } from './config.js';
import type { TaxReport, TaxReportStatus, TaxReportActivity, TaxReportMetric, TaxReportSettingsValues } from './types.js';
export interface TaxReportFiltersProps extends Omit<DomainFrameProps, 'children' | 'onSelect' | 'onChange' | 'onSubmit'> {
    query: string;
    status?: TaxReportStatus | '';
    onQueryChange: (query: string) => void;
    onStatusChange?: (status: TaxReportStatus | '') => void;
}
export function TaxReportFilters({ onStatusChange, ...props }: TaxReportFiltersProps) { return <DomainFilters config={config} {...props} onStatusChange={onStatusChange ? value => onStatusChange(value as TaxReportStatus | '') : undefined}/>; }
