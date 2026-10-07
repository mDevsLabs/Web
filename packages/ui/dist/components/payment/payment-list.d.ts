import { type DomainFrameProps } from '../../internal/domain.js';
import type { Payment } from './types.js';
export interface PaymentListProps extends Omit<DomainFrameProps, 'children' | 'onSelect' | 'onChange' | 'onSubmit'> {
    items: readonly Payment[];
    onSelect?: (item: Payment) => void;
    emptyMessage?: string;
}
export declare function PaymentList({ onSelect, ...props }: PaymentListProps): import("react").JSX.Element;
