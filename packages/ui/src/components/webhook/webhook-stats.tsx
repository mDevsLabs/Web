// Generated from scripts/data/domains.txt. One independent export and data contract per module.
'use client';
import { DomainStats, type DomainFrameProps } from '../../internal/domain.js';
import { config } from './config.js';
import type { Webhook, WebhookStatus, WebhookActivity, WebhookMetric, WebhookSettingsValues } from './types.js';
export interface WebhookStatsProps extends Omit<DomainFrameProps, 'children' | 'onSelect' | 'onChange' | 'onSubmit'> {
    metrics: readonly WebhookMetric[];
}
export function WebhookStats(props: WebhookStatsProps) { return <DomainStats config={config} {...props}/>; }
