// Generated from scripts/data/domains.txt. One independent export and data contract per module.
'use client';
import { DomainTimeline, type DomainFrameProps } from '../../internal/domain.js';
import { config } from './config.js';
import type { Event, EventStatus, EventActivity, EventMetric, EventSettingsValues } from './types.js';
export interface EventTimelineProps extends Omit<DomainFrameProps, 'children' | 'onSelect' | 'onChange' | 'onSubmit'> {
    events: readonly EventActivity[];
    emptyMessage?: string;
}
export function EventTimeline(props: EventTimelineProps) { return <DomainTimeline config={config} {...props}/>; }
