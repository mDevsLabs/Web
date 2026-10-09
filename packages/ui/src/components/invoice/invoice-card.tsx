// Generated from scripts/data/domains.txt. One independent export and data contract per module.
'use client';
import { DomainCard, type DomainFrameProps } from '../../internal/domain.js';
import { config } from './config.js';
import type { Invoice, InvoiceStatus, InvoiceActivity, InvoiceMetric, InvoiceSettingsValues } from './types.js';
export interface InvoiceCardProps extends Omit<DomainFrameProps, 'children' | 'onSelect' | 'onChange' | 'onSubmit'> {
    item: Invoice;
}
export function InvoiceCard(props: InvoiceCardProps) { return <DomainCard config={config} {...props}/>; }
