// Generated from scripts/data/domains.txt. One independent export and data contract per module.
'use client';
import { DomainList, type DomainFrameProps } from '../../internal/domain.js';
import { config } from './config.js';
import type { Invoice, InvoiceStatus, InvoiceActivity, InvoiceMetric, InvoiceSettingsValues } from './types.js';
export interface InvoiceListProps extends Omit<DomainFrameProps, 'children' | 'onSelect' | 'onChange' | 'onSubmit'> {
    items: readonly Invoice[];
    onSelect?: (item: Invoice) => void;
    emptyMessage?: string;
}
export function InvoiceList({ onSelect, ...props }: InvoiceListProps) { return <DomainList config={config} {...props} onSelect={onSelect ? item => onSelect(item as Invoice) : undefined}/>; }
