import { type DomainFrameProps } from '../../internal/domain.js';
import type { FormSubmission } from './types.js';
export interface FormSubmissionTableProps extends Omit<DomainFrameProps, 'children' | 'onSelect' | 'onChange' | 'onSubmit'> {
    items: readonly FormSubmission[];
    emptyMessage?: string;
}
export declare function FormSubmissionTable(props: FormSubmissionTableProps): import("react").JSX.Element;
