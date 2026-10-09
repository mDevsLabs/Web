import { type DomainFrameProps } from '../../internal/domain.js';
import type { TaskStatus } from './types.js';
export interface TaskFiltersProps extends Omit<DomainFrameProps, 'children' | 'onSelect' | 'onChange' | 'onSubmit'> {
    query: string;
    status?: TaskStatus | '';
    onQueryChange: (query: string) => void;
    onStatusChange?: (status: TaskStatus | '') => void;
}
export declare function TaskFilters({ onStatusChange, ...props }: TaskFiltersProps): import("react").JSX.Element;
