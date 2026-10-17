import { type DomainFrameProps } from '../../internal/domain.js';
import type { TransactionStatus } from './types.js';
export interface TransactionFiltersProps extends Omit<DomainFrameProps, 'children' | 'onSelect' | 'onChange' | 'onSubmit'> {
    query: string;
    status?: TransactionStatus | '';
    onQueryChange: (query: string) => void;
    onStatusChange?: (status: TransactionStatus | '') => void;
}
export declare function TransactionFilters({ onStatusChange, ...props }: TransactionFiltersProps): import("react").JSX.Element;
