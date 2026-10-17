import { type DomainFrameProps } from '../../internal/domain.js';
import type { TravelItinerary } from './types.js';
export interface TravelItineraryListProps extends Omit<DomainFrameProps, 'children' | 'onSelect' | 'onChange' | 'onSubmit'> {
    items: readonly TravelItinerary[];
    onSelect?: (item: TravelItinerary) => void;
    emptyMessage?: string;
}
export declare function TravelItineraryList({ onSelect, ...props }: TravelItineraryListProps): import("react").JSX.Element;
