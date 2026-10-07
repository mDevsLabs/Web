import { type DomainFrameProps } from '../../internal/domain.js';
import type { Cart } from './types.js';
export interface CartFormProps extends Omit<DomainFrameProps, 'children' | 'onSelect' | 'onChange' | 'onSubmit'> {
    initialValues?: Partial<Cart>;
    onSubmit: (value: Omit<Cart, 'id'>) => void;
    submitLabel?: string;
    pending?: boolean;
}
export declare function CartForm({ onSubmit, ...props }: CartFormProps): import("react").JSX.Element;
