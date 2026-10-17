import { type DomainFrameProps } from '../../internal/domain.js';
import type { FormSubmission } from './types.js';
export interface FormSubmissionListProps extends Omit<DomainFrameProps, 'children' | 'onSelect' | 'onChange' | 'onSubmit'> {
    items: readonly FormSubmission[];
    onSelect?: (item: FormSubmission) => void;
    emptyMessage?: string;
}
export declare function FormSubmissionList({ onSelect, ...props }: FormSubmissionListProps): import("react").JSX.Element;
