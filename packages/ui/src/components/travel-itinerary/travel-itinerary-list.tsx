// Generated from scripts/data/domains.txt. One independent export and data contract per module.
'use client';
import { DomainList, type DomainFrameProps } from '../../internal/domain.js';
import { config } from './config.js';
import type { TravelItinerary, TravelItineraryStatus, TravelItineraryActivity, TravelItineraryMetric, TravelItinerarySettingsValues } from './types.js';
export interface TravelItineraryListProps extends Omit<DomainFrameProps, 'children' | 'onSelect' | 'onChange' | 'onSubmit'> {
    items: readonly TravelItinerary[];
    onSelect?: (item: TravelItinerary) => void;
    emptyMessage?: string;
}
export function TravelItineraryList({ onSelect, ...props }: TravelItineraryListProps) { return <DomainList config={config} {...props} onSelect={onSelect ? item => onSelect(item as TravelItinerary) : undefined}/>; }
