import { type DomainFrameProps } from '../../internal/domain.js';
import type { Order } from './types.js';
export interface OrderListProps extends Omit<DomainFrameProps, 'children' | 'onSelect' | 'onChange' | 'onSubmit'> {
    items: readonly Order[];
    onSelect?: (item: Order) => void;
    emptyMessage?: string;
}
export declare function OrderList({ onSelect, ...props }: OrderListProps): import("react").JSX.Element;
