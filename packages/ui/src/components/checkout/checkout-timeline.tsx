// Generated from scripts/data/domains.txt. One independent export and data contract per module.
'use client';
import { DomainTimeline, type DomainFrameProps } from '../../internal/domain.js';
import { config } from './config.js';
import type { Checkout, CheckoutStatus, CheckoutActivity, CheckoutMetric, CheckoutSettingsValues } from './types.js';
export interface CheckoutTimelineProps extends Omit<DomainFrameProps, 'children' | 'onSelect' | 'onChange' | 'onSubmit'> {
    events: readonly CheckoutActivity[];
    emptyMessage?: string;
}
export function CheckoutTimeline(props: CheckoutTimelineProps) { return <DomainTimeline config={config} {...props}/>; }
