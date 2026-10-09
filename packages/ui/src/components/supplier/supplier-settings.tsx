// Generated from scripts/data/domains.txt. One independent export and data contract per module.
'use client';
import { DomainSettings, type DomainFrameProps } from '../../internal/domain.js';
import { config } from './config.js';
import type { Supplier, SupplierStatus, SupplierActivity, SupplierMetric, SupplierSettingsValues } from './types.js';
export interface SupplierSettingsProps extends Omit<DomainFrameProps, 'children' | 'onSelect' | 'onChange' | 'onSubmit'> {
    values: SupplierSettingsValues;
    onChange: (key: keyof SupplierSettingsValues, value: boolean) => void;
}
export function SupplierSettings({ onChange, ...props }: SupplierSettingsProps) { return <DomainSettings config={config} {...props} onChange={(key, value) => onChange(key as keyof SupplierSettingsValues, value)}/>; }
