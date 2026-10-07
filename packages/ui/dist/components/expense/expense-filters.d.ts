import { type DomainFrameProps } from '../../internal/domain.js';
import type { ExpenseStatus } from './types.js';
export interface ExpenseFiltersProps extends Omit<DomainFrameProps, 'children' | 'onSelect' | 'onChange' | 'onSubmit'> {
    query: string;
    status?: ExpenseStatus | '';
    onQueryChange: (query: string) => void;
    onStatusChange?: (status: ExpenseStatus | '') => void;
}
export declare function ExpenseFilters({ onStatusChange, ...props }: ExpenseFiltersProps): import("react").JSX.Element;
