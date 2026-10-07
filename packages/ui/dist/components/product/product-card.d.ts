import { type DomainFrameProps } from '../../internal/domain.js';
import type { Product } from './types.js';
export interface ProductCardProps extends Omit<DomainFrameProps, 'children' | 'onSelect' | 'onChange' | 'onSubmit'> {
    item: Product;
}
export declare function ProductCard(props: ProductCardProps): import("react").JSX.Element;
