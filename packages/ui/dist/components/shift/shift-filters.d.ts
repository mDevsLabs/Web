import { type DomainFrameProps } from '../../internal/domain.js';
import type { ShiftStatus } from './types.js';
export interface ShiftFiltersProps extends Omit<DomainFrameProps, 'children' | 'onSelect' | 'onChange' | 'onSubmit'> {
    query: string;
    status?: ShiftStatus | '';
    onQueryChange: (query: string) => void;
    onStatusChange?: (status: ShiftStatus | '') => void;
}
export declare function ShiftFilters({ onStatusChange, ...props }: ShiftFiltersProps): import("react").JSX.Element;
