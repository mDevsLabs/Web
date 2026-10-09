// Generated from scripts/data/domains.txt. One independent export and data contract per module.
'use client';
import { DomainSettings, type DomainFrameProps } from '../../internal/domain.js';
import { config } from './config.js';
import type { Payment, PaymentStatus, PaymentActivity, PaymentMetric, PaymentSettingsValues } from './types.js';
export interface PaymentSettingsProps extends Omit<DomainFrameProps, 'children' | 'onSelect' | 'onChange' | 'onSubmit'> {
    values: PaymentSettingsValues;
    onChange: (key: keyof PaymentSettingsValues, value: boolean) => void;
}
export function PaymentSettings({ onChange, ...props }: PaymentSettingsProps) { return <DomainSettings config={config} {...props} onChange={(key, value) => onChange(key as keyof PaymentSettingsValues, value)}/>; }
