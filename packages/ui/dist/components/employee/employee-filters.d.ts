import { type DomainFrameProps } from '../../internal/domain.js';
import type { EmployeeStatus } from './types.js';
export interface EmployeeFiltersProps extends Omit<DomainFrameProps, 'children' | 'onSelect' | 'onChange' | 'onSubmit'> {
    query: string;
    status?: EmployeeStatus | '';
    onQueryChange: (query: string) => void;
    onStatusChange?: (status: EmployeeStatus | '') => void;
}
export declare function EmployeeFilters({ onStatusChange, ...props }: EmployeeFiltersProps): import("react").JSX.Element;
