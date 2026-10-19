// Generated from scripts/data/domains.txt. One independent export and data contract per module.
'use client';
import { DomainSettings, type DomainFrameProps } from '../../internal/domain.js';
import { config } from './config.js';
import type { Cart, CartStatus, CartActivity, CartMetric, CartSettingsValues } from './types.js';
export interface CartSettingsProps extends Omit<DomainFrameProps, 'children' | 'onSelect' | 'onChange' | 'onSubmit'> {
    values: CartSettingsValues;
    onChange: (key: keyof CartSettingsValues, value: boolean) => void;
}
export function CartSettings({ onChange, ...props }: CartSettingsProps) { return <DomainSettings config={config} {...props} onChange={(key, value) => onChange(key as keyof CartSettingsValues, value)}/>; }
