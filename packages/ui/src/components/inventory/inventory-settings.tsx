// Generated from scripts/data/domains.txt. One independent export and data contract per module.
'use client';
import { DomainSettings, type DomainFrameProps } from '../../internal/domain.js';
import { config } from './config.js';
import type { Inventory, InventoryStatus, InventoryActivity, InventoryMetric, InventorySettingsValues } from './types.js';
export interface InventorySettingsProps extends Omit<DomainFrameProps, 'children' | 'onSelect' | 'onChange' | 'onSubmit'> {
    values: InventorySettingsValues;
    onChange: (key: keyof InventorySettingsValues, value: boolean) => void;
}
export function InventorySettings({ onChange, ...props }: InventorySettingsProps) { return <DomainSettings config={config} {...props} onChange={(key, value) => onChange(key as keyof InventorySettingsValues, value)}/>; }
