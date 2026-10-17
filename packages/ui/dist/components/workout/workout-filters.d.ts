import { type DomainFrameProps } from '../../internal/domain.js';
import type { WorkoutStatus } from './types.js';
export interface WorkoutFiltersProps extends Omit<DomainFrameProps, 'children' | 'onSelect' | 'onChange' | 'onSubmit'> {
    query: string;
    status?: WorkoutStatus | '';
    onQueryChange: (query: string) => void;
    onStatusChange?: (status: WorkoutStatus | '') => void;
}
export declare function WorkoutFilters({ onStatusChange, ...props }: WorkoutFiltersProps): import("react").JSX.Element;
