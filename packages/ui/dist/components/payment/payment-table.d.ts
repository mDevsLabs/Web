import { type DomainFrameProps } from '../../internal/domain.js';
import type { Payment } from './types.js';
export interface PaymentTableProps extends Omit<DomainFrameProps, 'children' | 'onSelect' | 'onChange' | 'onSubmit'> {
    items: readonly Payment[];
    emptyMessage?: string;
}
export declare function PaymentTable(props: PaymentTableProps): import("react").JSX.Element;
