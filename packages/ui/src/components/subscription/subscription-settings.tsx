// Generated from scripts/data/domains.txt. One independent export and data contract per module.
'use client';
import { DomainSettings, type DomainFrameProps } from '../../internal/domain.js';
import { config } from './config.js';
import type { Subscription, SubscriptionStatus, SubscriptionActivity, SubscriptionMetric, SubscriptionSettingsValues } from './types.js';
export interface SubscriptionSettingsProps extends Omit<DomainFrameProps, 'children' | 'onSelect' | 'onChange' | 'onSubmit'> {
    values: SubscriptionSettingsValues;
    onChange: (key: keyof SubscriptionSettingsValues, value: boolean) => void;
}
export function SubscriptionSettings({ onChange, ...props }: SubscriptionSettingsProps) { return <DomainSettings config={config} {...props} onChange={(key, value) => onChange(key as keyof SubscriptionSettingsValues, value)}/>; }
