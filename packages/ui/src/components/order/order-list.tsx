// Generated from scripts/data/domains.txt. One independent export and data contract per module.
'use client';
import { DomainList, type DomainFrameProps } from '../../internal/domain.js';
import { config } from './config.js';
import type { Order, OrderStatus, OrderActivity, OrderMetric, OrderSettingsValues } from './types.js';
export interface OrderListProps extends Omit<DomainFrameProps, 'children' | 'onSelect' | 'onChange' | 'onSubmit'> {
    items: readonly Order[];
    onSelect?: (item: Order) => void;
    emptyMessage?: string;
}
export function OrderList({ onSelect, ...props }: OrderListProps) { return <DomainList config={config} {...props} onSelect={onSelect ? item => onSelect(item as Order) : undefined}/>; }
