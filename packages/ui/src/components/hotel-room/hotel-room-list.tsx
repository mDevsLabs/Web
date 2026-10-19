// Generated from scripts/data/domains.txt. One independent export and data contract per module.
'use client';
import { DomainList, type DomainFrameProps } from '../../internal/domain.js';
import { config } from './config.js';
import type { HotelRoom, HotelRoomStatus, HotelRoomActivity, HotelRoomMetric, HotelRoomSettingsValues } from './types.js';
export interface HotelRoomListProps extends Omit<DomainFrameProps, 'children' | 'onSelect' | 'onChange' | 'onSubmit'> {
    items: readonly HotelRoom[];
    onSelect?: (item: HotelRoom) => void;
    emptyMessage?: string;
}
export function HotelRoomList({ onSelect, ...props }: HotelRoomListProps) { return <DomainList config={config} {...props} onSelect={onSelect ? item => onSelect(item as HotelRoom) : undefined}/>; }
