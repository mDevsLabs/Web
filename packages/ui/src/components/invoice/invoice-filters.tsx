// Generated from scripts/data/domains.txt. One independent export and data contract per module.
'use client';
import { DomainFilters, type DomainFrameProps } from '../../internal/domain.js';
import { config } from './config.js';
import type { Invoice, InvoiceStatus, InvoiceActivity, InvoiceMetric, InvoiceSettingsValues } from './types.js';
export interface InvoiceFiltersProps extends Omit<DomainFrameProps, 'children' | 'onSelect' | 'onChange' | 'onSubmit'> {
    query: string;
    status?: InvoiceStatus | '';
    onQueryChange: (query: string) => void;
    onStatusChange?: (status: InvoiceStatus | '') => void;
}
export function InvoiceFilters({ onStatusChange, ...props }: InvoiceFiltersProps) { return <DomainFilters config={config} {...props} onStatusChange={onStatusChange ? value => onStatusChange(value as InvoiceStatus | '') : undefined}/>; }
