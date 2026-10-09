import { type DomainFrameProps } from '../../internal/domain.js';
import type { Order } from './types.js';
export interface OrderTableProps extends Omit<DomainFrameProps, 'children' | 'onSelect' | 'onChange' | 'onSubmit'> {
    items: readonly Order[];
    emptyMessage?: string;
}
export declare function OrderTable(props: OrderTableProps): import("react").JSX.Element;
