// Generated from scripts/data/domains.txt. One independent export and data contract per module.
'use client';
import { DomainList, type DomainFrameProps } from '../../internal/domain.js';
import { config } from './config.js';
import type { Webhook, WebhookStatus, WebhookActivity, WebhookMetric, WebhookSettingsValues } from './types.js';
export interface WebhookListProps extends Omit<DomainFrameProps, 'children' | 'onSelect' | 'onChange' | 'onSubmit'> {
    items: readonly Webhook[];
    onSelect?: (item: Webhook) => void;
    emptyMessage?: string;
}
export function WebhookList({ onSelect, ...props }: WebhookListProps) { return <DomainList config={config} {...props} onSelect={onSelect ? item => onSelect(item as Webhook) : undefined}/>; }
