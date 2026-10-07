import { type DomainFrameProps } from '../../internal/domain.js';
import type { FormSubmission } from './types.js';
export interface FormSubmissionCardProps extends Omit<DomainFrameProps, 'children' | 'onSelect' | 'onChange' | 'onSubmit'> {
    item: FormSubmission;
}
export declare function FormSubmissionCard(props: FormSubmissionCardProps): import("react").JSX.Element;
