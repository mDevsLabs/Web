// Generated from scripts/data/domains.txt. One independent export and data contract per module.
'use client';
import { DomainSettings, type DomainFrameProps } from '../../internal/domain.js';
import { config } from './config.js';
import type { Order, OrderStatus, OrderActivity, OrderMetric, OrderSettingsValues } from './types.js';
export interface OrderSettingsProps extends Omit<DomainFrameProps, 'children' | 'onSelect' | 'onChange' | 'onSubmit'> {
    values: OrderSettingsValues;
    onChange: (key: keyof OrderSettingsValues, value: boolean) => void;
}
export function OrderSettings({ onChange, ...props }: OrderSettingsProps) { return <DomainSettings config={config} {...props} onChange={(key, value) => onChange(key as keyof OrderSettingsValues, value)}/>; }
