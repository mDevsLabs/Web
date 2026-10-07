// Generated from scripts/data/domains.txt. One independent export and data contract per module.
'use client';
import { DomainTable, type DomainFrameProps } from '../../internal/domain.js';
import { config } from './config.js';
import type { Expense, ExpenseStatus, ExpenseActivity, ExpenseMetric, ExpenseSettingsValues } from './types.js';
export interface ExpenseTableProps extends Omit<DomainFrameProps, 'children' | 'onSelect' | 'onChange' | 'onSubmit'> {
    items: readonly Expense[];
    emptyMessage?: string;
}
export function ExpenseTable(props: ExpenseTableProps) { return <DomainTable config={config} {...props}/>; }
