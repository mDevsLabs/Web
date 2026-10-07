// Generated from scripts/data/domains.txt. One independent export and data contract per module.
'use client';
import { DomainList, type DomainFrameProps } from '../../internal/domain.js';
import { config } from './config.js';
import type { Supplier, SupplierStatus, SupplierActivity, SupplierMetric, SupplierSettingsValues } from './types.js';
export interface SupplierListProps extends Omit<DomainFrameProps, 'children' | 'onSelect' | 'onChange' | 'onSubmit'> {
    items: readonly Supplier[];
    onSelect?: (item: Supplier) => void;
    emptyMessage?: string;
}
export function SupplierList({ onSelect, ...props }: SupplierListProps) { return <DomainList config={config} {...props} onSelect={onSelect ? item => onSelect(item as Supplier) : undefined}/>; }
