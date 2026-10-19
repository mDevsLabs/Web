// Generated from scripts/data/domains.txt. One independent export and data contract per module.
'use client';
import { DomainSettings, type DomainFrameProps } from '../../internal/domain.js';
import { config } from './config.js';
import type { PurchaseOrder, PurchaseOrderStatus, PurchaseOrderActivity, PurchaseOrderMetric, PurchaseOrderSettingsValues } from './types.js';
export interface PurchaseOrderSettingsProps extends Omit<DomainFrameProps, 'children' | 'onSelect' | 'onChange' | 'onSubmit'> {
    values: PurchaseOrderSettingsValues;
    onChange: (key: keyof PurchaseOrderSettingsValues, value: boolean) => void;
}
export function PurchaseOrderSettings({ onChange, ...props }: PurchaseOrderSettingsProps) { return <DomainSettings config={config} {...props} onChange={(key, value) => onChange(key as keyof PurchaseOrderSettingsValues, value)}/>; }
