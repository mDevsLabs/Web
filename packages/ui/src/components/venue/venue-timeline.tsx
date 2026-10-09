// Generated from scripts/data/domains.txt. One independent export and data contract per module.
'use client';
import { DomainTimeline, type DomainFrameProps } from '../../internal/domain.js';
import { config } from './config.js';
import type { Venue, VenueStatus, VenueActivity, VenueMetric, VenueSettingsValues } from './types.js';
export interface VenueTimelineProps extends Omit<DomainFrameProps, 'children' | 'onSelect' | 'onChange' | 'onSubmit'> {
    events: readonly VenueActivity[];
    emptyMessage?: string;
}
export function VenueTimeline(props: VenueTimelineProps) { return <DomainTimeline config={config} {...props}/>; }
