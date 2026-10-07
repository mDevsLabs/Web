// Generated from scripts/data/domains.txt. One independent export and data contract per module.
'use client';
import { DomainEmptyState, type DomainFrameProps } from '../../internal/domain.js';
import { config } from './config.js';
import type { PurchaseOrder, PurchaseOrderStatus, PurchaseOrderActivity, PurchaseOrderMetric, PurchaseOrderSettingsValues } from './types.js';
export interface PurchaseOrderEmptyStateProps extends Omit<DomainFrameProps, 'children' | 'onSelect' | 'onChange' | 'onSubmit'> {
    message?: string;
    actionLabel?: string;
    onAction?: () => void;
}
export function PurchaseOrderEmptyState(props: PurchaseOrderEmptyStateProps) { return <DomainEmptyState config={config} {...props}/>; }
