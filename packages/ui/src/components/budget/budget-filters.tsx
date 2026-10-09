// Generated from scripts/data/domains.txt. One independent export and data contract per module.
'use client';
import { DomainFilters, type DomainFrameProps } from '../../internal/domain.js';
import { config } from './config.js';
import type { Budget, BudgetStatus, BudgetActivity, BudgetMetric, BudgetSettingsValues } from './types.js';
export interface BudgetFiltersProps extends Omit<DomainFrameProps, 'children' | 'onSelect' | 'onChange' | 'onSubmit'> {
    query: string;
    status?: BudgetStatus | '';
    onQueryChange: (query: string) => void;
    onStatusChange?: (status: BudgetStatus | '') => void;
}
export function BudgetFilters({ onStatusChange, ...props }: BudgetFiltersProps) { return <DomainFilters config={config} {...props} onStatusChange={onStatusChange ? value => onStatusChange(value as BudgetStatus | '') : undefined}/>; }
