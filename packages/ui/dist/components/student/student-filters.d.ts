import { type DomainFrameProps } from '../../internal/domain.js';
import type { StudentStatus } from './types.js';
export interface StudentFiltersProps extends Omit<DomainFrameProps, 'children' | 'onSelect' | 'onChange' | 'onSubmit'> {
    query: string;
    status?: StudentStatus | '';
    onQueryChange: (query: string) => void;
    onStatusChange?: (status: StudentStatus | '') => void;
}
export declare function StudentFilters({ onStatusChange, ...props }: StudentFiltersProps): import("react").JSX.Element;
