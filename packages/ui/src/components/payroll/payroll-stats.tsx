// Generated from scripts/data/domains.txt. One independent export and data contract per module.
'use client';
import { DomainStats, type DomainFrameProps } from '../../internal/domain.js';
import { config } from './config.js';
import type { Payroll, PayrollStatus, PayrollActivity, PayrollMetric, PayrollSettingsValues } from './types.js';
export interface PayrollStatsProps extends Omit<DomainFrameProps, 'children' | 'onSelect' | 'onChange' | 'onSubmit'> {
    metrics: readonly PayrollMetric[];
}
export function PayrollStats(props: PayrollStatsProps) { return <DomainStats config={config} {...props}/>; }
