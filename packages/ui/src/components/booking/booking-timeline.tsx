// Generated from scripts/data/domains.txt. One independent export and data contract per module.
'use client';
import { DomainTimeline, type DomainFrameProps } from '../../internal/domain.js';
import { config } from './config.js';
import type { Booking, BookingStatus, BookingActivity, BookingMetric, BookingSettingsValues } from './types.js';
export interface BookingTimelineProps extends Omit<DomainFrameProps, 'children' | 'onSelect' | 'onChange' | 'onSubmit'> {
    events: readonly BookingActivity[];
    emptyMessage?: string;
}
export function BookingTimeline(props: BookingTimelineProps) { return <DomainTimeline config={config} {...props}/>; }
