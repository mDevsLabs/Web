// Generated from scripts/data/domains.txt. One independent export and data contract per module.
'use client';
import { DomainFilters, type DomainFrameProps } from '../../internal/domain.js';
import { config } from './config.js';
import type { PurchaseOrder, PurchaseOrderStatus, PurchaseOrderActivity, PurchaseOrderMetric, PurchaseOrderSettingsValues } from './types.js';
export interface PurchaseOrderFiltersProps extends Omit<DomainFrameProps, 'children' | 'onSelect' | 'onChange' | 'onSubmit'> {
    query: string;
    status?: PurchaseOrderStatus | '';
    onQueryChange: (query: string) => void;
    onStatusChange?: (status: PurchaseOrderStatus | '') => void;
}
export function PurchaseOrderFilters({ onStatusChange, ...props }: PurchaseOrderFiltersProps) { return <DomainFilters config={config} {...props} onStatusChange={onStatusChange ? value => onStatusChange(value as PurchaseOrderStatus | '') : undefined}/>; }
