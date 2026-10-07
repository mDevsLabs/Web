// Generated from scripts/data/domains.txt. One independent export and data contract per module.
'use client';
import { DomainFilters, type DomainFrameProps } from '../../internal/domain.js';
import { config } from './config.js';
import type { Payroll, PayrollStatus, PayrollActivity, PayrollMetric, PayrollSettingsValues } from './types.js';
export interface PayrollFiltersProps extends Omit<DomainFrameProps, 'children' | 'onSelect' | 'onChange' | 'onSubmit'> {
    query: string;
    status?: PayrollStatus | '';
    onQueryChange: (query: string) => void;
    onStatusChange?: (status: PayrollStatus | '') => void;
}
export function PayrollFilters({ onStatusChange, ...props }: PayrollFiltersProps) { return <DomainFilters config={config} {...props} onStatusChange={onStatusChange ? value => onStatusChange(value as PayrollStatus | '') : undefined}/>; }
