// Generated from scripts/data/domains.txt. One independent export and data contract per module.
'use client';
import { DomainSettings, type DomainFrameProps } from '../../internal/domain.js';
import { config } from './config.js';
import type { Warehouse, WarehouseStatus, WarehouseActivity, WarehouseMetric, WarehouseSettingsValues } from './types.js';
export interface WarehouseSettingsProps extends Omit<DomainFrameProps, 'children' | 'onSelect' | 'onChange' | 'onSubmit'> {
    values: WarehouseSettingsValues;
    onChange: (key: keyof WarehouseSettingsValues, value: boolean) => void;
}
export function WarehouseSettings({ onChange, ...props }: WarehouseSettingsProps) { return <DomainSettings config={config} {...props} onChange={(key, value) => onChange(key as keyof WarehouseSettingsValues, value)}/>; }
