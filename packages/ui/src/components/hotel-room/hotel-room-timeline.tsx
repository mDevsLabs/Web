// Generated from scripts/data/domains.txt. One independent export and data contract per module.
'use client';
import { DomainTimeline, type DomainFrameProps } from '../../internal/domain.js';
import { config } from './config.js';
import type { HotelRoom, HotelRoomStatus, HotelRoomActivity, HotelRoomMetric, HotelRoomSettingsValues } from './types.js';
export interface HotelRoomTimelineProps extends Omit<DomainFrameProps, 'children' | 'onSelect' | 'onChange' | 'onSubmit'> {
    events: readonly HotelRoomActivity[];
    emptyMessage?: string;
}
export function HotelRoomTimeline(props: HotelRoomTimelineProps) { return <DomainTimeline config={config} {...props}/>; }
