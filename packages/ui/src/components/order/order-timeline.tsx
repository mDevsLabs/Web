// Generated from scripts/data/domains.txt. One independent export and data contract per module.
'use client';
import { DomainTimeline, type DomainFrameProps } from '../../internal/domain.js';
import { config } from './config.js';
import type { Order, OrderStatus, OrderActivity, OrderMetric, OrderSettingsValues } from './types.js';
export interface OrderTimelineProps extends Omit<DomainFrameProps, 'children' | 'onSelect' | 'onChange' | 'onSubmit'> {
    events: readonly OrderActivity[];
    emptyMessage?: string;
}
export function OrderTimeline(props: OrderTimelineProps) { return <DomainTimeline config={config} {...props}/>; }
