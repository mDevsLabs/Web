// Generated from scripts/data/domains.txt. One independent export and data contract per module.
'use client';
import { DomainOverview, type DomainFrameProps } from '../../internal/domain.js';
import { config } from './config.js';
import type { Order, OrderStatus, OrderActivity, OrderMetric, OrderSettingsValues } from './types.js';
export interface OrderOverviewProps extends Omit<DomainFrameProps, 'children' | 'onSelect' | 'onChange' | 'onSubmit'> {
    items: readonly Order[];
    metrics: readonly OrderMetric[];
}
export function OrderOverview(props: OrderOverviewProps) { return <DomainOverview config={config} {...props}/>; }
