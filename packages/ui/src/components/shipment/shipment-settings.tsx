// Generated from scripts/data/domains.txt. One independent export and data contract per module.
'use client';
import { DomainSettings, type DomainFrameProps } from '../../internal/domain.js';
import { config } from './config.js';
import type { Shipment, ShipmentStatus, ShipmentActivity, ShipmentMetric, ShipmentSettingsValues } from './types.js';
export interface ShipmentSettingsProps extends Omit<DomainFrameProps, 'children' | 'onSelect' | 'onChange' | 'onSubmit'> {
    values: ShipmentSettingsValues;
    onChange: (key: keyof ShipmentSettingsValues, value: boolean) => void;
}
export function ShipmentSettings({ onChange, ...props }: ShipmentSettingsProps) { return <DomainSettings config={config} {...props} onChange={(key, value) => onChange(key as keyof ShipmentSettingsValues, value)}/>; }
