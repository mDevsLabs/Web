import { type DomainFrameProps } from '../../internal/domain.js';
import type { Payment } from './types.js';
export interface PaymentCardProps extends Omit<DomainFrameProps, 'children' | 'onSelect' | 'onChange' | 'onSubmit'> {
    item: Payment;
}
export declare function PaymentCard(props: PaymentCardProps): import("react").JSX.Element;
