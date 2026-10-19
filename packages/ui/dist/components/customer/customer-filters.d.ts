import { type DomainFrameProps } from '../../internal/domain.js';
import type { CustomerStatus } from './types.js';
export interface CustomerFiltersProps extends Omit<DomainFrameProps, 'children' | 'onSelect' | 'onChange' | 'onSubmit'> {
    query: string;
    status?: CustomerStatus | '';
    onQueryChange: (query: string) => void;
    onStatusChange?: (status: CustomerStatus | '') => void;
}
export declare function CustomerFilters({ onStatusChange, ...props }: CustomerFiltersProps): import("react").JSX.Element;
