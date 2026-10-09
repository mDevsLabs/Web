import { type DomainFrameProps } from '../../internal/domain.js';
import type { Customer } from './types.js';
export interface CustomerFormProps extends Omit<DomainFrameProps, 'children' | 'onSelect' | 'onChange' | 'onSubmit'> {
    initialValues?: Partial<Customer>;
    onSubmit: (value: Omit<Customer, 'id'>) => void;
    submitLabel?: string;
    pending?: boolean;
}
export declare function CustomerForm({ onSubmit, ...props }: CustomerFormProps): import("react").JSX.Element;
