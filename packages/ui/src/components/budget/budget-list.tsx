// Generated from scripts/data/domains.txt. One independent export and data contract per module.
'use client';
import { DomainList, type DomainFrameProps } from '../../internal/domain.js';
import { config } from './config.js';
import type { Budget, BudgetStatus, BudgetActivity, BudgetMetric, BudgetSettingsValues } from './types.js';
export interface BudgetListProps extends Omit<DomainFrameProps, 'children' | 'onSelect' | 'onChange' | 'onSubmit'> {
    items: readonly Budget[];
    onSelect?: (item: Budget) => void;
    emptyMessage?: string;
}
export function BudgetList({ onSelect, ...props }: BudgetListProps) { return <DomainList config={config} {...props} onSelect={onSelect ? item => onSelect(item as Budget) : undefined}/>; }
