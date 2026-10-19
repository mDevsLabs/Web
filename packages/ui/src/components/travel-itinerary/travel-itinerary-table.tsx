// Generated from scripts/data/domains.txt. One independent export and data contract per module.
'use client';
import { DomainTable, type DomainFrameProps } from '../../internal/domain.js';
import { config } from './config.js';
import type { TravelItinerary, TravelItineraryStatus, TravelItineraryActivity, TravelItineraryMetric, TravelItinerarySettingsValues } from './types.js';
export interface TravelItineraryTableProps extends Omit<DomainFrameProps, 'children' | 'onSelect' | 'onChange' | 'onSubmit'> {
    items: readonly TravelItinerary[];
    emptyMessage?: string;
}
export function TravelItineraryTable(props: TravelItineraryTableProps) { return <DomainTable config={config} {...props}/>; }
