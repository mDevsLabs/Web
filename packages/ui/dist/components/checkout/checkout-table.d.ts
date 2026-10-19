import { type DomainFrameProps } from '../../internal/domain.js';
import type { Checkout } from './types.js';
export interface CheckoutTableProps extends Omit<DomainFrameProps, 'children' | 'onSelect' | 'onChange' | 'onSubmit'> {
    items: readonly Checkout[];
    emptyMessage?: string;
}
export declare function CheckoutTable(props: CheckoutTableProps): import("react").JSX.Element;
