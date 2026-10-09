import { type DomainFrameProps } from '../../internal/domain.js';
import type { Checkout } from './types.js';
export interface CheckoutCardProps extends Omit<DomainFrameProps, 'children' | 'onSelect' | 'onChange' | 'onSubmit'> {
    item: Checkout;
}
export declare function CheckoutCard(props: CheckoutCardProps): import("react").JSX.Element;
