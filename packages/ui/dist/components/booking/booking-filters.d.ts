import { type DomainFrameProps } from '../../internal/domain.js';
import type { BookingStatus } from './types.js';
export interface BookingFiltersProps extends Omit<DomainFrameProps, 'children' | 'onSelect' | 'onChange' | 'onSubmit'> {
    query: string;
    status?: BookingStatus | '';
    onQueryChange: (query: string) => void;
    onStatusChange?: (status: BookingStatus | '') => void;
}
export declare function BookingFilters({ onStatusChange, ...props }: BookingFiltersProps): import("react").JSX.Element;
