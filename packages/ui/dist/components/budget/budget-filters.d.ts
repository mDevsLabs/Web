import { type DomainFrameProps } from '../../internal/domain.js';
import type { BudgetStatus } from './types.js';
export interface BudgetFiltersProps extends Omit<DomainFrameProps, 'children' | 'onSelect' | 'onChange' | 'onSubmit'> {
    query: string;
    status?: BudgetStatus | '';
    onQueryChange: (query: string) => void;
    onStatusChange?: (status: BudgetStatus | '') => void;
}
export declare function BudgetFilters({ onStatusChange, ...props }: BudgetFiltersProps): import("react").JSX.Element;
