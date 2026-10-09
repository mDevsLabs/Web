// Generated from scripts/data/domains.txt. One independent export and data contract per module.
'use client';
import { DomainList, type DomainFrameProps } from '../../internal/domain.js';
import { config } from './config.js';
import type { Booking, BookingStatus, BookingActivity, BookingMetric, BookingSettingsValues } from './types.js';
export interface BookingListProps extends Omit<DomainFrameProps, 'children' | 'onSelect' | 'onChange' | 'onSubmit'> {
    items: readonly Booking[];
    onSelect?: (item: Booking) => void;
    emptyMessage?: string;
}
export function BookingList({ onSelect, ...props }: BookingListProps) { return <DomainList config={config} {...props} onSelect={onSelect ? item => onSelect(item as Booking) : undefined}/>; }
