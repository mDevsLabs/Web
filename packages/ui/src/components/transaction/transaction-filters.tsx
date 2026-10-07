// Generated from scripts/data/domains.txt. One independent export and data contract per module.
'use client';
import { DomainFilters, type DomainFrameProps } from '../../internal/domain.js';
import { config } from './config.js';
import type { Transaction, TransactionStatus, TransactionActivity, TransactionMetric, TransactionSettingsValues } from './types.js';
export interface TransactionFiltersProps extends Omit<DomainFrameProps, 'children' | 'onSelect' | 'onChange' | 'onSubmit'> {
    query: string;
    status?: TransactionStatus | '';
    onQueryChange: (query: string) => void;
    onStatusChange?: (status: TransactionStatus | '') => void;
}
export function TransactionFilters({ onStatusChange, ...props }: TransactionFiltersProps) { return <DomainFilters config={config} {...props} onStatusChange={onStatusChange ? value => onStatusChange(value as TransactionStatus | '') : undefined}/>; }
