import { type DomainFrameProps } from '../../internal/domain.js';
import type { BankAccountStatus } from './types.js';
export interface BankAccountFiltersProps extends Omit<DomainFrameProps, 'children' | 'onSelect' | 'onChange' | 'onSubmit'> {
    query: string;
    status?: BankAccountStatus | '';
    onQueryChange: (query: string) => void;
    onStatusChange?: (status: BankAccountStatus | '') => void;
}
export declare function BankAccountFilters({ onStatusChange, ...props }: BankAccountFiltersProps): import("react").JSX.Element;
