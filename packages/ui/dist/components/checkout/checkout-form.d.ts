import { type DomainFrameProps } from '../../internal/domain.js';
import type { Checkout } from './types.js';
export interface CheckoutFormProps extends Omit<DomainFrameProps, 'children' | 'onSelect' | 'onChange' | 'onSubmit'> {
    initialValues?: Partial<Checkout>;
    onSubmit: (value: Omit<Checkout, 'id'>) => void;
    submitLabel?: string;
    pending?: boolean;
}
export declare function CheckoutForm({ onSubmit, ...props }: CheckoutFormProps): import("react").JSX.Element;
