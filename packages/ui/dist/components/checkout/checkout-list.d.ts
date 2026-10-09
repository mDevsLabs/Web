import { type DomainFrameProps } from '../../internal/domain.js';
import type { Checkout } from './types.js';
export interface CheckoutListProps extends Omit<DomainFrameProps, 'children' | 'onSelect' | 'onChange' | 'onSubmit'> {
    items: readonly Checkout[];
    onSelect?: (item: Checkout) => void;
    emptyMessage?: string;
}
export declare function CheckoutList({ onSelect, ...props }: CheckoutListProps): import("react").JSX.Element;
