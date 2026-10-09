import { type DomainFrameProps } from '../../internal/domain.js';
import type { TravelItineraryStatus } from './types.js';
export interface TravelItineraryFiltersProps extends Omit<DomainFrameProps, 'children' | 'onSelect' | 'onChange' | 'onSubmit'> {
    query: string;
    status?: TravelItineraryStatus | '';
    onQueryChange: (query: string) => void;
    onStatusChange?: (status: TravelItineraryStatus | '') => void;
}
export declare function TravelItineraryFilters({ onStatusChange, ...props }: TravelItineraryFiltersProps): import("react").JSX.Element;
