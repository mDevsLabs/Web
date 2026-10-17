// Generated from scripts/data/domains.txt. One independent export and data contract per module.
'use client';
import { DomainList, type DomainFrameProps } from '../../internal/domain.js';
import { config } from './config.js';
import type { Customer, CustomerStatus, CustomerActivity, CustomerMetric, CustomerSettingsValues } from './types.js';
export interface CustomerListProps extends Omit<DomainFrameProps, 'children' | 'onSelect' | 'onChange' | 'onSubmit'> {
    items: readonly Customer[];
    onSelect?: (item: Customer) => void;
    emptyMessage?: string;
}
export function CustomerList({ onSelect, ...props }: CustomerListProps) { return <DomainList config={config} {...props} onSelect={onSelect ? item => onSelect(item as Customer) : undefined}/>; }
