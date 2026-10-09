// Generated from scripts/data/domains.txt. One independent export and data contract per module.
'use client';
import { DomainTimeline, type DomainFrameProps } from '../../internal/domain.js';
import { config } from './config.js';
import type { Flight, FlightStatus, FlightActivity, FlightMetric, FlightSettingsValues } from './types.js';
export interface FlightTimelineProps extends Omit<DomainFrameProps, 'children' | 'onSelect' | 'onChange' | 'onSubmit'> {
    events: readonly FlightActivity[];
    emptyMessage?: string;
}
export function FlightTimeline(props: FlightTimelineProps) { return <DomainTimeline config={config} {...props}/>; }
