import { type DomainFrameProps } from '../../internal/domain.js';
import type { SupplierStatus } from './types.js';
export interface SupplierFiltersProps extends Omit<DomainFrameProps, 'children' | 'onSelect' | 'onChange' | 'onSubmit'> {
    query: string;
    status?: SupplierStatus | '';
    onQueryChange: (query: string) => void;
    onStatusChange?: (status: SupplierStatus | '') => void;
}
export declare function SupplierFilters({ onStatusChange, ...props }: SupplierFiltersProps): import("react").JSX.Element;
