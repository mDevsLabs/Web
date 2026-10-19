import { type DomainFrameProps } from '../../internal/domain.js';
import type { Order } from './types.js';
export interface OrderCardProps extends Omit<DomainFrameProps, 'children' | 'onSelect' | 'onChange' | 'onSubmit'> {
    item: Order;
}
export declare function OrderCard(props: OrderCardProps): import("react").JSX.Element;
