import { type DomainFrameProps } from '../../internal/domain.js';
export interface JobPostingEmptyStateProps extends Omit<DomainFrameProps, 'children' | 'onSelect' | 'onChange' | 'onSubmit'> {
    message?: string;
    actionLabel?: string;
    onAction?: () => void;
}
export declare function JobPostingEmptyState(props: JobPostingEmptyStateProps): import("react").JSX.Element;
