// Generated from scripts/data/domains.txt. One independent export and data contract per module.
'use client';
import { DomainSettings, type DomainFrameProps } from '../../internal/domain.js';
import { config } from './config.js';
import type { Webhook, WebhookStatus, WebhookActivity, WebhookMetric, WebhookSettingsValues } from './types.js';
export interface WebhookSettingsProps extends Omit<DomainFrameProps, 'children' | 'onSelect' | 'onChange' | 'onSubmit'> {
    values: WebhookSettingsValues;
    onChange: (key: keyof WebhookSettingsValues, value: boolean) => void;
}
export function WebhookSettings({ onChange, ...props }: WebhookSettingsProps) { return <DomainSettings config={config} {...props} onChange={(key, value) => onChange(key as keyof WebhookSettingsValues, value)}/>; }
