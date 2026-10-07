import { type DomainFrameProps } from '../../internal/domain.js';
import type { HabitStatus } from './types.js';
export interface HabitFiltersProps extends Omit<DomainFrameProps, 'children' | 'onSelect' | 'onChange' | 'onSubmit'> {
    query: string;
    status?: HabitStatus | '';
    onQueryChange: (query: string) => void;
    onStatusChange?: (status: HabitStatus | '') => void;
}
export declare function HabitFilters({ onStatusChange, ...props }: HabitFiltersProps): import("react").JSX.Element;
