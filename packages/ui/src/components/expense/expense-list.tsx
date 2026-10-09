// Generated from scripts/data/domains.txt. One independent export and data contract per module.
'use client';
import { DomainList, type DomainFrameProps } from '../../internal/domain.js';
import { config } from './config.js';
import type { Expense, ExpenseStatus, ExpenseActivity, ExpenseMetric, ExpenseSettingsValues } from './types.js';
export interface ExpenseListProps extends Omit<DomainFrameProps, 'children' | 'onSelect' | 'onChange' | 'onSubmit'> {
    items: readonly Expense[];
    onSelect?: (item: Expense) => void;
    emptyMessage?: string;
}
export function ExpenseList({ onSelect, ...props }: ExpenseListProps) { return <DomainList config={config} {...props} onSelect={onSelect ? item => onSelect(item as Expense) : undefined}/>; }
