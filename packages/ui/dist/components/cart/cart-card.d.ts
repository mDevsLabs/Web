import { type DomainFrameProps } from '../../internal/domain.js';
import type { Cart } from './types.js';
export interface CartCardProps extends Omit<DomainFrameProps, 'children' | 'onSelect' | 'onChange' | 'onSubmit'> {
    item: Cart;
}
export declare function CartCard(props: CartCardProps): import("react").JSX.Element;
