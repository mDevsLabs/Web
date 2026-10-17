import { type DomainFrameProps } from '../../internal/domain.js';
import type { VenueStatus } from './types.js';
export interface VenueFiltersProps extends Omit<DomainFrameProps, 'children' | 'onSelect' | 'onChange' | 'onSubmit'> {
    query: string;
    status?: VenueStatus | '';
    onQueryChange: (query: string) => void;
    onStatusChange?: (status: VenueStatus | '') => void;
}
export declare function VenueFilters({ onStatusChange, ...props }: VenueFiltersProps): import("react").JSX.Element;
