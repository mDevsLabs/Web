// Generated from scripts/data/domains.txt. One independent export and data contract per module.
'use client';
import { DomainList, type DomainFrameProps } from '../../internal/domain.js';
import { config } from './config.js';
import type { PurchaseOrder, PurchaseOrderStatus, PurchaseOrderActivity, PurchaseOrderMetric, PurchaseOrderSettingsValues } from './types.js';
export interface PurchaseOrderListProps extends Omit<DomainFrameProps, 'children' | 'onSelect' | 'onChange' | 'onSubmit'> {
    items: readonly PurchaseOrder[];
    onSelect?: (item: PurchaseOrder) => void;
    emptyMessage?: string;
}
export function PurchaseOrderList({ onSelect, ...props }: PurchaseOrderListProps) { return <DomainList config={config} {...props} onSelect={onSelect ? item => onSelect(item as PurchaseOrder) : undefined}/>; }
