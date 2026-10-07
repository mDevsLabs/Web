// Generated from scripts/data/domains.txt. One independent export and data contract per module.
'use client';
import { DomainOverview, type DomainFrameProps } from '../../internal/domain.js';
import { config } from './config.js';
import type { Event, EventStatus, EventActivity, EventMetric, EventSettingsValues } from './types.js';
export interface EventOverviewProps extends Omit<DomainFrameProps, 'children' | 'onSelect' | 'onChange' | 'onSubmit'> {
    items: readonly Event[];
    metrics: readonly EventMetric[];
}
export function EventOverview(props: EventOverviewProps) { return <DomainOverview config={config} {...props}/>; }
