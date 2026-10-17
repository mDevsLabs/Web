import { type DomainFrameProps } from '../../internal/domain.js';
import type { Order } from './types.js';
export interface OrderFormProps extends Omit<DomainFrameProps, 'children' | 'onSelect' | 'onChange' | 'onSubmit'> {
    initialValues?: Partial<Order>;
    onSubmit: (value: Omit<Order, 'id'>) => void;
    submitLabel?: string;
    pending?: boolean;
}
export declare function OrderForm({ onSubmit, ...props }: OrderFormProps): import("react").JSX.Element;
