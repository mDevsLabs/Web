import { type DomainFrameProps } from '../../internal/domain.js';
import type { Contact } from './types.js';
export interface ContactFormProps extends Omit<DomainFrameProps, 'children' | 'onSelect' | 'onChange' | 'onSubmit'> {
    initialValues?: Partial<Contact>;
    onSubmit: (value: Omit<Contact, 'id'>) => void;
    submitLabel?: string;
    pending?: boolean;
}
export declare function ContactForm({ onSubmit, ...props }: ContactFormProps): import("react").JSX.Element;
