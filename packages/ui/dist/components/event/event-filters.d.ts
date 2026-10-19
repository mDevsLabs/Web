import { type DomainFrameProps } from '../../internal/domain.js';
import type { EventStatus } from './types.js';
export interface EventFiltersProps extends Omit<DomainFrameProps, 'children' | 'onSelect' | 'onChange' | 'onSubmit'> {
    query: string;
    status?: EventStatus | '';
    onQueryChange: (query: string) => void;
    onStatusChange?: (status: EventStatus | '') => void;
}
export declare function EventFilters({ onStatusChange, ...props }: EventFiltersProps): import("react").JSX.Element;
