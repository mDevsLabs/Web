// Generated from scripts/data/domains.txt. One independent export and data contract per module.
'use client';
import { DomainCard, type DomainFrameProps } from '../../internal/domain.js';
import { config } from './config.js';
import type { Webhook, WebhookStatus, WebhookActivity, WebhookMetric, WebhookSettingsValues } from './types.js';
export interface WebhookCardProps extends Omit<DomainFrameProps, 'children' | 'onSelect' | 'onChange' | 'onSubmit'> {
    item: Webhook;
}
export function WebhookCard(props: WebhookCardProps) { return <DomainCard config={config} {...props}/>; }
