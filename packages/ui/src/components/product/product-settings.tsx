// Generated from scripts/data/domains.txt. One independent export and data contract per module.
'use client';
import { DomainSettings, type DomainFrameProps } from '../../internal/domain.js';
import { config } from './config.js';
import type { Product, ProductStatus, ProductActivity, ProductMetric, ProductSettingsValues } from './types.js';
export interface ProductSettingsProps extends Omit<DomainFrameProps, 'children' | 'onSelect' | 'onChange' | 'onSubmit'> {
    values: ProductSettingsValues;
    onChange: (key: keyof ProductSettingsValues, value: boolean) => void;
}
export function ProductSettings({ onChange, ...props }: ProductSettingsProps) { return <DomainSettings config={config} {...props} onChange={(key, value) => onChange(key as keyof ProductSettingsValues, value)}/>; }
