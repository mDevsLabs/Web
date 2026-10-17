import { type DomainFrameProps } from '../../internal/domain.js';
import type { JobPosting } from './types.js';
export interface JobPostingFormProps extends Omit<DomainFrameProps, 'children' | 'onSelect' | 'onChange' | 'onSubmit'> {
    initialValues?: Partial<JobPosting>;
    onSubmit: (value: Omit<JobPosting, 'id'>) => void;
    submitLabel?: string;
    pending?: boolean;
}
export declare function JobPostingForm({ onSubmit, ...props }: JobPostingFormProps): import("react").JSX.Element;
