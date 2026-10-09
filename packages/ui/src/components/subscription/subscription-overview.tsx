// Generated from scripts/data/domains.txt. One independent export and data contract per module.
'use client';
import { DomainOverview, type DomainFrameProps } from '../../internal/domain.js';
import { config } from './config.js';
import type { Subscription, SubscriptionStatus, SubscriptionActivity, SubscriptionMetric, SubscriptionSettingsValues } from './types.js';
export interface SubscriptionOverviewProps extends Omit<DomainFrameProps, 'children' | 'onSelect' | 'onChange' | 'onSubmit'> {
    items: readonly Subscription[];
    metrics: readonly SubscriptionMetric[];
}
export function SubscriptionOverview(props: SubscriptionOverviewProps) { return <DomainOverview config={config} {...props}/>; }
