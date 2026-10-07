import { type DomainFrameProps } from '../../internal/domain.js';
import type { Invoice } from './types.js';
export interface InvoiceFormProps extends Omit<DomainFrameProps, 'children' | 'onSelect' | 'onChange' | 'onSubmit'> {
    initialValues?: Partial<Invoice>;
    onSubmit: (value: Omit<Invoice, 'id'>) => void;
    submitLabel?: string;
    pending?: boolean;
}
export declare function InvoiceForm({ onSubmit, ...props }: InvoiceFormProps): import("react").JSX.Element;
