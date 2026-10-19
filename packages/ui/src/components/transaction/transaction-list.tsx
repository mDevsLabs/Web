// Generated from scripts/data/domains.txt. One independent export and data contract per module.
'use client';
import { DomainList, type DomainFrameProps } from '../../internal/domain.js';
import { config } from './config.js';
import type { Transaction, TransactionStatus, TransactionActivity, TransactionMetric, TransactionSettingsValues } from './types.js';
export interface TransactionListProps extends Omit<DomainFrameProps, 'children' | 'onSelect' | 'onChange' | 'onSubmit'> {
    items: readonly Transaction[];
    onSelect?: (item: Transaction) => void;
    emptyMessage?: string;
}
export function TransactionList({ onSelect, ...props }: TransactionListProps) { return <DomainList config={config} {...props} onSelect={onSelect ? item => onSelect(item as Transaction) : undefined}/>; }
