// Generated from scripts/data/domains.txt. One independent export and data contract per module.
'use client';
import { DomainOverview, type DomainFrameProps } from '../../internal/domain.js';
import { config } from './config.js';
import type { Transaction, TransactionStatus, TransactionActivity, TransactionMetric, TransactionSettingsValues } from './types.js';
export interface TransactionOverviewProps extends Omit<DomainFrameProps, 'children' | 'onSelect' | 'onChange' | 'onSubmit'> {
    items: readonly Transaction[];
    metrics: readonly TransactionMetric[];
}
export function TransactionOverview(props: TransactionOverviewProps) { return <DomainOverview config={config} {...props}/>; }
