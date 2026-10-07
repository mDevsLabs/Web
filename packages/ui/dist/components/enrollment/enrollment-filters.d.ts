import { type DomainFrameProps } from '../../internal/domain.js';
import type { EnrollmentStatus } from './types.js';
export interface EnrollmentFiltersProps extends Omit<DomainFrameProps, 'children' | 'onSelect' | 'onChange' | 'onSubmit'> {
    query: string;
    status?: EnrollmentStatus | '';
    onQueryChange: (query: string) => void;
    onStatusChange?: (status: EnrollmentStatus | '') => void;
}
export declare function EnrollmentFilters({ onStatusChange, ...props }: EnrollmentFiltersProps): import("react").JSX.Element;
