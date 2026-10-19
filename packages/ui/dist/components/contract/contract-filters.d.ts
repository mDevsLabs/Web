import { type DomainFrameProps } from '../../internal/domain.js';
import type { ContractStatus } from './types.js';
export interface ContractFiltersProps extends Omit<DomainFrameProps, 'children' | 'onSelect' | 'onChange' | 'onSubmit'> {
    query: string;
    status?: ContractStatus | '';
    onQueryChange: (query: string) => void;
    onStatusChange?: (status: ContractStatus | '') => void;
}
export declare function ContractFilters({ onStatusChange, ...props }: ContractFiltersProps): import("react").JSX.Element;
