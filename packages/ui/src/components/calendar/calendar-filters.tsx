// Generated from scripts/data/domains.txt. One independent export and data contract per module.
'use client';
import { DomainFilters, type DomainFrameProps } from '../../internal/domain.js';
import { config } from './config.js';
import type { Calendar, CalendarStatus, CalendarActivity, CalendarMetric, CalendarSettingsValues } from './types.js';
export interface CalendarFiltersProps extends Omit<DomainFrameProps, 'children' | 'onSelect' | 'onChange' | 'onSubmit'> {
    query: string;
    status?: CalendarStatus | '';
    onQueryChange: (query: string) => void;
    onStatusChange?: (status: CalendarStatus | '') => void;
}
export function CalendarFilters({ onStatusChange, ...props }: CalendarFiltersProps) { return <DomainFilters config={config} {...props} onStatusChange={onStatusChange ? value => onStatusChange(value as CalendarStatus | '') : undefined}/>; }
