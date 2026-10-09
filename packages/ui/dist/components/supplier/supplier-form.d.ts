import { type DomainFrameProps } from '../../internal/domain.js';
import type { Supplier } from './types.js';
export interface SupplierFormProps extends Omit<DomainFrameProps, 'children' | 'onSelect' | 'onChange' | 'onSubmit'> {
    initialValues?: Partial<Supplier>;
    onSubmit: (value: Omit<Supplier, 'id'>) => void;
    submitLabel?: string;
    pending?: boolean;
}
export declare function SupplierForm({ onSubmit, ...props }: SupplierFormProps): import("react").JSX.Element;
