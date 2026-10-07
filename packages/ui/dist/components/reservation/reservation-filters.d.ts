import { type DomainFrameProps } from '../../internal/domain.js';
import type { ReservationStatus } from './types.js';
export interface ReservationFiltersProps extends Omit<DomainFrameProps, 'children' | 'onSelect' | 'onChange' | 'onSubmit'> {
    query: string;
    status?: ReservationStatus | '';
    onQueryChange: (query: string) => void;
    onStatusChange?: (status: ReservationStatus | '') => void;
}
export declare function ReservationFilters({ onStatusChange, ...props }: ReservationFiltersProps): import("react").JSX.Element;
