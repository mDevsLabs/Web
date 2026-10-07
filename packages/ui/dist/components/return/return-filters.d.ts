import { type DomainFrameProps } from '../../internal/domain.js';
import type { ReturnStatus } from './types.js';
export interface ReturnFiltersProps extends Omit<DomainFrameProps, 'children' | 'onSelect' | 'onChange' | 'onSubmit'> {
    query: string;
    status?: ReturnStatus | '';
    onQueryChange: (query: string) => void;
    onStatusChange?: (status: ReturnStatus | '') => void;
}
export declare function ReturnFilters({ onStatusChange, ...props }: ReturnFiltersProps): import("react").JSX.Element;
