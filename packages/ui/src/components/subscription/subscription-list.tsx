// Generated from scripts/data/domains.txt. One independent export and data contract per module.
'use client';
import { DomainList, type DomainFrameProps } from '../../internal/domain.js';
import { config } from './config.js';
import type { Subscription, SubscriptionStatus, SubscriptionActivity, SubscriptionMetric, SubscriptionSettingsValues } from './types.js';
export interface SubscriptionListProps extends Omit<DomainFrameProps, 'children' | 'onSelect' | 'onChange' | 'onSubmit'> {
    items: readonly Subscription[];
    onSelect?: (item: Subscription) => void;
    emptyMessage?: string;
}
export function SubscriptionList({ onSelect, ...props }: SubscriptionListProps) { return <DomainList config={config} {...props} onSelect={onSelect ? item => onSelect(item as Subscription) : undefined}/>; }
