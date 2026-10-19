// Generated from scripts/data/domains.txt. One independent export and data contract per module.
'use client';
import { DomainTimeline, type DomainFrameProps } from '../../internal/domain.js';
import { config } from './config.js';
import type { Subscription, SubscriptionStatus, SubscriptionActivity, SubscriptionMetric, SubscriptionSettingsValues } from './types.js';
export interface SubscriptionTimelineProps extends Omit<DomainFrameProps, 'children' | 'onSelect' | 'onChange' | 'onSubmit'> {
    events: readonly SubscriptionActivity[];
    emptyMessage?: string;
}
export function SubscriptionTimeline(props: SubscriptionTimelineProps) { return <DomainTimeline config={config} {...props}/>; }
