import { type DomainFrameProps } from '../../internal/domain.js';
import type { CalendarStatus } from './types.js';
export interface CalendarFiltersProps extends Omit<DomainFrameProps, 'children' | 'onSelect' | 'onChange' | 'onSubmit'> {
    query: string;
    status?: CalendarStatus | '';
    onQueryChange: (query: string) => void;
    onStatusChange?: (status: CalendarStatus | '') => void;
}
export declare function CalendarFilters({ onStatusChange, ...props }: CalendarFiltersProps): import("react").JSX.Element;
