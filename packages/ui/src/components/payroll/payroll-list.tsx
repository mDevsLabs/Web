// Generated from scripts/data/domains.txt. One independent export and data contract per module.
'use client';
import { DomainList, type DomainFrameProps } from '../../internal/domain.js';
import { config } from './config.js';
import type { Payroll, PayrollStatus, PayrollActivity, PayrollMetric, PayrollSettingsValues } from './types.js';
export interface PayrollListProps extends Omit<DomainFrameProps, 'children' | 'onSelect' | 'onChange' | 'onSubmit'> {
    items: readonly Payroll[];
    onSelect?: (item: Payroll) => void;
    emptyMessage?: string;
}
export function PayrollList({ onSelect, ...props }: PayrollListProps) { return <DomainList config={config} {...props} onSelect={onSelect ? item => onSelect(item as Payroll) : undefined}/>; }
