// Generated from scripts/data/domains.txt. One independent export and data contract per module.
'use client';
import { DomainTimeline, type DomainFrameProps } from '../../internal/domain.js';
import { config } from './config.js';
import type { Transaction, TransactionStatus, TransactionActivity, TransactionMetric, TransactionSettingsValues } from './types.js';
export interface TransactionTimelineProps extends Omit<DomainFrameProps, 'children' | 'onSelect' | 'onChange' | 'onSubmit'> {
    events: readonly TransactionActivity[];
    emptyMessage?: string;
}
export function TransactionTimeline(props: TransactionTimelineProps) { return <DomainTimeline config={config} {...props}/>; }
