import { type DomainFrameProps } from '../../internal/domain.js';
import type { TravelItinerary, TravelItineraryMetric } from './types.js';
export interface TravelItineraryOverviewProps extends Omit<DomainFrameProps, 'children' | 'onSelect' | 'onChange' | 'onSubmit'> {
    items: readonly TravelItinerary[];
    metrics: readonly TravelItineraryMetric[];
}
export declare function TravelItineraryOverview(props: TravelItineraryOverviewProps): import("react").JSX.Element;
