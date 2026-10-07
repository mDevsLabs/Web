// Generated from scripts/data/domains.txt. One independent export and data contract per module.
'use client';
import { DomainFilters, type DomainFrameProps } from '../../internal/domain.js';
import { config } from './config.js';
import type { Venue, VenueStatus, VenueActivity, VenueMetric, VenueSettingsValues } from './types.js';
export interface VenueFiltersProps extends Omit<DomainFrameProps, 'children' | 'onSelect' | 'onChange' | 'onSubmit'> {
    query: string;
    status?: VenueStatus | '';
    onQueryChange: (query: string) => void;
    onStatusChange?: (status: VenueStatus | '') => void;
}
export function VenueFilters({ onStatusChange, ...props }: VenueFiltersProps) { return <DomainFilters config={config} {...props} onStatusChange={onStatusChange ? value => onStatusChange(value as VenueStatus | '') : undefined}/>; }
