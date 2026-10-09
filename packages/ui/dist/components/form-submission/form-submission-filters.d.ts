import { type DomainFrameProps } from '../../internal/domain.js';
import type { FormSubmissionStatus } from './types.js';
export interface FormSubmissionFiltersProps extends Omit<DomainFrameProps, 'children' | 'onSelect' | 'onChange' | 'onSubmit'> {
    query: string;
    status?: FormSubmissionStatus | '';
    onQueryChange: (query: string) => void;
    onStatusChange?: (status: FormSubmissionStatus | '') => void;
}
export declare function FormSubmissionFilters({ onStatusChange, ...props }: FormSubmissionFiltersProps): import("react").JSX.Element;
