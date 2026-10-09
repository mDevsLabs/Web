import { type DomainFrameProps } from '../../internal/domain.js';
import type { FlightStatus } from './types.js';
export interface FlightFiltersProps extends Omit<DomainFrameProps, 'children' | 'onSelect' | 'onChange' | 'onSubmit'> {
    query: string;
    status?: FlightStatus | '';
    onQueryChange: (query: string) => void;
    onStatusChange?: (status: FlightStatus | '') => void;
}
export declare function FlightFilters({ onStatusChange, ...props }: FlightFiltersProps): import("react").JSX.Element;
