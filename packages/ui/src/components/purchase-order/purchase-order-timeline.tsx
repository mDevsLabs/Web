// Generated from scripts/data/domains.txt. One independent export and data contract per module.
'use client';
import { DomainTimeline, type DomainFrameProps } from '../../internal/domain.js';
import { config } from './config.js';
import type { PurchaseOrder, PurchaseOrderStatus, PurchaseOrderActivity, PurchaseOrderMetric, PurchaseOrderSettingsValues } from './types.js';
export interface PurchaseOrderTimelineProps extends Omit<DomainFrameProps, 'children' | 'onSelect' | 'onChange' | 'onSubmit'> {
    events: readonly PurchaseOrderActivity[];
    emptyMessage?: string;
}
export function PurchaseOrderTimeline(props: PurchaseOrderTimelineProps) { return <DomainTimeline config={config} {...props}/>; }
