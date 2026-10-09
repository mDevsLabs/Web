// Generated from scripts/data/domains.txt. One independent export and data contract per module.
'use client';
import { DomainFilters, type DomainFrameProps } from '../../internal/domain.js';
import { config } from './config.js';
import type { HotelRoom, HotelRoomStatus, HotelRoomActivity, HotelRoomMetric, HotelRoomSettingsValues } from './types.js';
export interface HotelRoomFiltersProps extends Omit<DomainFrameProps, 'children' | 'onSelect' | 'onChange' | 'onSubmit'> {
    query: string;
    status?: HotelRoomStatus | '';
    onQueryChange: (query: string) => void;
    onStatusChange?: (status: HotelRoomStatus | '') => void;
}
export function HotelRoomFilters({ onStatusChange, ...props }: HotelRoomFiltersProps) { return <DomainFilters config={config} {...props} onStatusChange={onStatusChange ? value => onStatusChange(value as HotelRoomStatus | '') : undefined}/>; }
