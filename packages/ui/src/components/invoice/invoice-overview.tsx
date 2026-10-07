// Generated from scripts/data/domains.txt. One independent export and data contract per module.
'use client';
import { DomainOverview, type DomainFrameProps } from '../../internal/domain.js';
import { config } from './config.js';
import type { Invoice, InvoiceStatus, InvoiceActivity, InvoiceMetric, InvoiceSettingsValues } from './types.js';
export interface InvoiceOverviewProps extends Omit<DomainFrameProps, 'children' | 'onSelect' | 'onChange' | 'onSubmit'> {
    items: readonly Invoice[];
    metrics: readonly InvoiceMetric[];
}
export function InvoiceOverview(props: InvoiceOverviewProps) { return <DomainOverview config={config} {...props}/>; }
