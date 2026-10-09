import { type DomainFrameProps } from '../../internal/domain.js';
import type { Lead } from './types.js';
export interface LeadFormProps extends Omit<DomainFrameProps, 'children' | 'onSelect' | 'onChange' | 'onSubmit'> {
    initialValues?: Partial<Lead>;
    onSubmit: (value: Omit<Lead, 'id'>) => void;
    submitLabel?: string;
    pending?: boolean;
}
export declare function LeadForm({ onSubmit, ...props }: LeadFormProps): import("react").JSX.Element;
