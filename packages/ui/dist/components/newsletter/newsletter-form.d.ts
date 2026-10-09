import { type DomainFrameProps } from '../../internal/domain.js';
import type { Newsletter } from './types.js';
export interface NewsletterFormProps extends Omit<DomainFrameProps, 'children' | 'onSelect' | 'onChange' | 'onSubmit'> {
    initialValues?: Partial<Newsletter>;
    onSubmit: (value: Omit<Newsletter, 'id'>) => void;
    submitLabel?: string;
    pending?: boolean;
}
export declare function NewsletterForm({ onSubmit, ...props }: NewsletterFormProps): import("react").JSX.Element;
