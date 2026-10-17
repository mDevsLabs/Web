import { type DomainFrameProps } from '../../internal/domain.js';
import type { FormSubmission } from './types.js';
export interface FormSubmissionFormProps extends Omit<DomainFrameProps, 'children' | 'onSelect' | 'onChange' | 'onSubmit'> {
    initialValues?: Partial<FormSubmission>;
    onSubmit: (value: Omit<FormSubmission, 'id'>) => void;
    submitLabel?: string;
    pending?: boolean;
}
export declare function FormSubmissionForm({ onSubmit, ...props }: FormSubmissionFormProps): import("react").JSX.Element;
