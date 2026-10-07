import { type DomainFrameProps } from '../../internal/domain.js';
import type { TravelItinerary } from './types.js';
export interface TravelItineraryTableProps extends Omit<DomainFrameProps, 'children' | 'onSelect' | 'onChange' | 'onSubmit'> {
    items: readonly TravelItinerary[];
    emptyMessage?: string;
}
export declare function TravelItineraryTable(props: TravelItineraryTableProps): import("react").JSX.Element;
