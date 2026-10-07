// Generated from scripts/data/domains.txt. One independent export and data contract per module.
'use client';
import { DomainTable, type DomainFrameProps } from '../../internal/domain.js';
import { config } from './config.js';
import type { Budget, BudgetStatus, BudgetActivity, BudgetMetric, BudgetSettingsValues } from './types.js';
export interface BudgetTableProps extends Omit<DomainFrameProps, 'children' | 'onSelect' | 'onChange' | 'onSubmit'> {
    items: readonly Budget[];
    emptyMessage?: string;
}
export function BudgetTable(props: BudgetTableProps) { return <DomainTable config={config} {...props}/>; }
