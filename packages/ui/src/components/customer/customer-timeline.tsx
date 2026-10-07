// Generated from scripts/data/domains.txt. One independent export and data contract per module.
'use client';
import { DomainTimeline, type DomainFrameProps } from '../../internal/domain.js';
import { config } from './config.js';
import type { Customer, CustomerStatus, CustomerActivity, CustomerMetric, CustomerSettingsValues } from './types.js';
export interface CustomerTimelineProps extends Omit<DomainFrameProps, 'children' | 'onSelect' | 'onChange' | 'onSubmit'> {
    events: readonly CustomerActivity[];
    emptyMessage?: string;
}
export function CustomerTimeline(props: CustomerTimelineProps) { return <DomainTimeline config={config} {...props}/>; }
