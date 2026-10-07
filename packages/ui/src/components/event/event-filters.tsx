// Generated from scripts/data/domains.txt. One independent export and data contract per module.
'use client';
import { DomainFilters, type DomainFrameProps } from '../../internal/domain.js';
import { config } from './config.js';
import type { Event, EventStatus, EventActivity, EventMetric, EventSettingsValues } from './types.js';
export interface EventFiltersProps extends Omit<DomainFrameProps, 'children' | 'onSelect' | 'onChange' | 'onSubmit'> {
    query: string;
    status?: EventStatus | '';
    onQueryChange: (query: string) => void;
    onStatusChange?: (status: EventStatus | '') => void;
}
export function EventFilters({ onStatusChange, ...props }: EventFiltersProps) { return <DomainFilters config={config} {...props} onStatusChange={onStatusChange ? value => onStatusChange(value as EventStatus | '') : undefined}/>; }
