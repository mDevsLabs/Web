// Generated from scripts/data/domains.txt. One independent export and data contract per module.
'use client';
import { DomainOverview, type DomainFrameProps } from '../../internal/domain.js';
import { config } from './config.js';
import type { PurchaseOrder, PurchaseOrderStatus, PurchaseOrderActivity, PurchaseOrderMetric, PurchaseOrderSettingsValues } from './types.js';
export interface PurchaseOrderOverviewProps extends Omit<DomainFrameProps, 'children' | 'onSelect' | 'onChange' | 'onSubmit'> {
    items: readonly PurchaseOrder[];
    metrics: readonly PurchaseOrderMetric[];
}
export function PurchaseOrderOverview(props: PurchaseOrderOverviewProps) { return <DomainOverview config={config} {...props}/>; }
