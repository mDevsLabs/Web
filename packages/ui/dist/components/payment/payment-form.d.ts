import { type DomainFrameProps } from '../../internal/domain.js';
import type { Payment } from './types.js';
export interface PaymentFormProps extends Omit<DomainFrameProps, 'children' | 'onSelect' | 'onChange' | 'onSubmit'> {
    initialValues?: Partial<Payment>;
    onSubmit: (value: Omit<Payment, 'id'>) => void;
    submitLabel?: string;
    pending?: boolean;
}
export declare function PaymentForm({ onSubmit, ...props }: PaymentFormProps): import("react").JSX.Element;
