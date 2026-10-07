// Generated from scripts/data/domains.txt. One independent export and data contract per module.
'use client';
import { DomainOverview, type DomainFrameProps } from '../../internal/domain.js';
import { config } from './config.js';
import type { TravelItinerary, TravelItineraryStatus, TravelItineraryActivity, TravelItineraryMetric, TravelItinerarySettingsValues } from './types.js';
export interface TravelItineraryOverviewProps extends Omit<DomainFrameProps, 'children' | 'onSelect' | 'onChange' | 'onSubmit'> {
    items: readonly TravelItinerary[];
    metrics: readonly TravelItineraryMetric[];
}
export function TravelItineraryOverview(props: TravelItineraryOverviewProps) { return <DomainOverview config={config} {...props}/>; }
