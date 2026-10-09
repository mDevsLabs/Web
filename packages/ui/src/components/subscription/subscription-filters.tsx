// Generated from scripts/data/domains.txt. One independent export and data contract per module.
'use client';
import { DomainFilters, type DomainFrameProps } from '../../internal/domain.js';
import { config } from './config.js';
import type { Subscription, SubscriptionStatus, SubscriptionActivity, SubscriptionMetric, SubscriptionSettingsValues } from './types.js';
export interface SubscriptionFiltersProps extends Omit<DomainFrameProps, 'children' | 'onSelect' | 'onChange' | 'onSubmit'> {
    query: string;
    status?: SubscriptionStatus | '';
    onQueryChange: (query: string) => void;
    onStatusChange?: (status: SubscriptionStatus | '') => void;
}
export function SubscriptionFilters({ onStatusChange, ...props }: SubscriptionFiltersProps) { return <DomainFilters config={config} {...props} onStatusChange={onStatusChange ? value => onStatusChange(value as SubscriptionStatus | '') : undefined}/>; }
