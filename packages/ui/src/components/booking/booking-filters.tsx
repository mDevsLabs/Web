// Generated from scripts/data/domains.txt. One independent export and data contract per module.
'use client';
import { DomainFilters, type DomainFrameProps } from '../../internal/domain.js';
import { config } from './config.js';
import type { Booking, BookingStatus, BookingActivity, BookingMetric, BookingSettingsValues } from './types.js';
export interface BookingFiltersProps extends Omit<DomainFrameProps, 'children' | 'onSelect' | 'onChange' | 'onSubmit'> {
    query: string;
    status?: BookingStatus | '';
    onQueryChange: (query: string) => void;
    onStatusChange?: (status: BookingStatus | '') => void;
}
export function BookingFilters({ onStatusChange, ...props }: BookingFiltersProps) { return <DomainFilters config={config} {...props} onStatusChange={onStatusChange ? value => onStatusChange(value as BookingStatus | '') : undefined}/>; }
