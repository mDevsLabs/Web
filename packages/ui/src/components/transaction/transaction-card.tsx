// Generated from scripts/data/domains.txt. One independent export and data contract per module.
'use client';
import { DomainCard, type DomainFrameProps } from '../../internal/domain.js';
import { config } from './config.js';
import type { Transaction, TransactionStatus, TransactionActivity, TransactionMetric, TransactionSettingsValues } from './types.js';
export interface TransactionCardProps extends Omit<DomainFrameProps, 'children' | 'onSelect' | 'onChange' | 'onSubmit'> {
    item: Transaction;
}
export function TransactionCard(props: TransactionCardProps) { return <DomainCard config={config} {...props}/>; }
