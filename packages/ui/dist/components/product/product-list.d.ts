import { type DomainFrameProps } from '../../internal/domain.js';
import type { Product } from './types.js';
export interface ProductListProps extends Omit<DomainFrameProps, 'children' | 'onSelect' | 'onChange' | 'onSubmit'> {
    items: readonly Product[];
    onSelect?: (item: Product) => void;
    emptyMessage?: string;
}
export declare function ProductList({ onSelect, ...props }: ProductListProps): import("react").JSX.Element;
