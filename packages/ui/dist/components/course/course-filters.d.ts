import { type DomainFrameProps } from '../../internal/domain.js';
import type { CourseStatus } from './types.js';
export interface CourseFiltersProps extends Omit<DomainFrameProps, 'children' | 'onSelect' | 'onChange' | 'onSubmit'> {
    query: string;
    status?: CourseStatus | '';
    onQueryChange: (query: string) => void;
    onStatusChange?: (status: CourseStatus | '') => void;
}
export declare function CourseFilters({ onStatusChange, ...props }: CourseFiltersProps): import("react").JSX.Element;
