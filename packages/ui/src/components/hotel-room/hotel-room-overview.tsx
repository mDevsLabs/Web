// Generated from scripts/data/domains.txt. One independent export and data contract per module.
'use client';
import { DomainOverview, type DomainFrameProps } from '../../internal/domain.js';
import { config } from './config.js';
import type { HotelRoom, HotelRoomStatus, HotelRoomActivity, HotelRoomMetric, HotelRoomSettingsValues } from './types.js';
export interface HotelRoomOverviewProps extends Omit<DomainFrameProps, 'children' | 'onSelect' | 'onChange' | 'onSubmit'> {
    items: readonly HotelRoom[];
    metrics: readonly HotelRoomMetric[];
}
export function HotelRoomOverview(props: HotelRoomOverviewProps) { return <DomainOverview config={config} {...props}/>; }
