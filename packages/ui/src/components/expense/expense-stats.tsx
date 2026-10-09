// Generated from scripts/data/domains.txt. One independent export and data contract per module.
'use client';
import { DomainStats, type DomainFrameProps } from '../../internal/domain.js';
import { config } from './config.js';
import type { Expense, ExpenseStatus, ExpenseActivity, ExpenseMetric, ExpenseSettingsValues } from './types.js';
export interface ExpenseStatsProps extends Omit<DomainFrameProps, 'children' | 'onSelect' | 'onChange' | 'onSubmit'> {
    metrics: readonly ExpenseMetric[];
}
export function ExpenseStats(props: ExpenseStatsProps) { return <DomainStats config={config} {...props}/>; }
