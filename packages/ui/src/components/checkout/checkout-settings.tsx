// Generated from scripts/data/domains.txt. One independent export and data contract per module.
'use client';
import { DomainSettings, type DomainFrameProps } from '../../internal/domain.js';
import { config } from './config.js';
import type { Checkout, CheckoutStatus, CheckoutActivity, CheckoutMetric, CheckoutSettingsValues } from './types.js';
export interface CheckoutSettingsProps extends Omit<DomainFrameProps, 'children' | 'onSelect' | 'onChange' | 'onSubmit'> {
    values: CheckoutSettingsValues;
    onChange: (key: keyof CheckoutSettingsValues, value: boolean) => void;
}
export function CheckoutSettings({ onChange, ...props }: CheckoutSettingsProps) { return <DomainSettings config={config} {...props} onChange={(key, value) => onChange(key as keyof CheckoutSettingsValues, value)}/>; }
