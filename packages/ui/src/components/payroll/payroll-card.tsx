// Generated from scripts/data/domains.txt. One independent export and data contract per module.
'use client';
import { DomainCard, type DomainFrameProps } from '../../internal/domain.js';
import { config } from './config.js';
import type { Payroll, PayrollStatus, PayrollActivity, PayrollMetric, PayrollSettingsValues } from './types.js';
export interface PayrollCardProps extends Omit<DomainFrameProps, 'children' | 'onSelect' | 'onChange' | 'onSubmit'> {
    item: Payroll;
}
export function PayrollCard(props: PayrollCardProps) { return <DomainCard config={config} {...props}/>; }
