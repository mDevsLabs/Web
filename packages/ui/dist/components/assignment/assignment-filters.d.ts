import { type DomainFrameProps } from '../../internal/domain.js';
import type { AssignmentStatus } from './types.js';
export interface AssignmentFiltersProps extends Omit<DomainFrameProps, 'children' | 'onSelect' | 'onChange' | 'onSubmit'> {
    query: string;
    status?: AssignmentStatus | '';
    onQueryChange: (query: string) => void;
    onStatusChange?: (status: AssignmentStatus | '') => void;
}
export declare function AssignmentFilters({ onStatusChange, ...props }: AssignmentFiltersProps): import("react").JSX.Element;
