// Generated from scripts/data/domains.txt. One independent export and data contract per module.
'use client';
import { DomainFilters, type DomainFrameProps } from '../../internal/domain.js';
import { config } from './config.js';
import type { TravelItinerary, TravelItineraryStatus, TravelItineraryActivity, TravelItineraryMetric, TravelItinerarySettingsValues } from './types.js';
export interface TravelItineraryFiltersProps extends Omit<DomainFrameProps, 'children' | 'onSelect' | 'onChange' | 'onSubmit'> {
    query: string;
    status?: TravelItineraryStatus | '';
    onQueryChange: (query: string) => void;
    onStatusChange?: (status: TravelItineraryStatus | '') => void;
}
export function TravelItineraryFilters({ onStatusChange, ...props }: TravelItineraryFiltersProps) { return <DomainFilters config={config} {...props} onStatusChange={onStatusChange ? value => onStatusChange(value as TravelItineraryStatus | '') : undefined}/>; }
