import { type DomainFrameProps } from '../../internal/domain.js';
export interface FormSubmissionEmptyStateProps extends Omit<DomainFrameProps, 'children' | 'onSelect' | 'onChange' | 'onSubmit'> {
    message?: string;
    actionLabel?: string;
    onAction?: () => void;
}
export declare function FormSubmissionEmptyState(props: FormSubmissionEmptyStateProps): import("react").JSX.Element;
