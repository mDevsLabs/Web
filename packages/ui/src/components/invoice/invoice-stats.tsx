// Generated from scripts/data/domains.txt. One independent export and data contract per module.
'use client';
import { DomainStats, type DomainFrameProps } from '../../internal/domain.js';
import { config } from './config.js';
import type { Invoice, InvoiceStatus, InvoiceActivity, InvoiceMetric, InvoiceSettingsValues } from './types.js';
export interface InvoiceStatsProps extends Omit<DomainFrameProps, 'children' | 'onSelect' | 'onChange' | 'onSubmit'> {
    metrics: readonly InvoiceMetric[];
}
export function InvoiceStats(props: InvoiceStatsProps) { return <DomainStats config={config} {...props}/>; }
