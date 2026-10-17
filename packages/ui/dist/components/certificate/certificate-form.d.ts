import { type DomainFrameProps } from '../../internal/domain.js';
import type { Certificate } from './types.js';
export interface CertificateFormProps extends Omit<DomainFrameProps, 'children' | 'onSelect' | 'onChange' | 'onSubmit'> {
    initialValues?: Partial<Certificate>;
    onSubmit: (value: Omit<Certificate, 'id'>) => void;
    submitLabel?: string;
    pending?: boolean;
}
export declare function CertificateForm({ onSubmit, ...props }: CertificateFormProps): import("react").JSX.Element;
