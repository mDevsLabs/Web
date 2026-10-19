// Generated from scripts/data/domains.txt. One independent export and data contract per module.
'use client';
import { DomainFilters, type DomainFrameProps } from '../../internal/domain.js';
import { config } from './config.js';
import type { Webhook, WebhookStatus, WebhookActivity, WebhookMetric, WebhookSettingsValues } from './types.js';
export interface WebhookFiltersProps extends Omit<DomainFrameProps, 'children' | 'onSelect' | 'onChange' | 'onSubmit'> {
    query: string;
    status?: WebhookStatus | '';
    onQueryChange: (query: string) => void;
    onStatusChange?: (status: WebhookStatus | '') => void;
}
export function WebhookFilters({ onStatusChange, ...props }: WebhookFiltersProps) { return <DomainFilters config={config} {...props} onStatusChange={onStatusChange ? value => onStatusChange(value as WebhookStatus | '') : undefined}/>; }
