import { type DomainFrameProps } from '../../internal/domain.js';
import type { Product } from './types.js';
export interface ProductTableProps extends Omit<DomainFrameProps, 'children' | 'onSelect' | 'onChange' | 'onSubmit'> {
    items: readonly Product[];
    emptyMessage?: string;
}
export declare function ProductTable(props: ProductTableProps): import("react").JSX.Element;
