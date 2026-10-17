import { type DomainFrameProps } from '../../internal/domain.js';
import type { TravelItinerary } from './types.js';
export interface TravelItineraryCardProps extends Omit<DomainFrameProps, 'children' | 'onSelect' | 'onChange' | 'onSubmit'> {
    item: TravelItinerary;
}
export declare function TravelItineraryCard(props: TravelItineraryCardProps): import("react").JSX.Element;
