import { type DomainFrameProps } from '../../internal/domain.js';
import type { Product } from './types.js';
export interface ProductFormProps extends Omit<DomainFrameProps, 'children' | 'onSelect' | 'onChange' | 'onSubmit'> {
    initialValues?: Partial<Product>;
    onSubmit: (value: Omit<Product, 'id'>) => void;
    submitLabel?: string;
    pending?: boolean;
}
export declare function ProductForm({ onSubmit, ...props }: ProductFormProps): import("react").JSX.Element;
