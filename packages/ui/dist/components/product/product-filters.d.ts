import { type DomainFrameProps } from '../../internal/domain.js';
import type { ProductStatus } from './types.js';
export interface ProductFiltersProps extends Omit<DomainFrameProps, 'children' | 'onSelect' | 'onChange' | 'onSubmit'> {
    query: string;
    status?: ProductStatus | '';
    onQueryChange: (query: string) => void;
    onStatusChange?: (status: ProductStatus | '') => void;
}
export declare function ProductFilters({ onStatusChange, ...props }: ProductFiltersProps): import("react").JSX.Element;
