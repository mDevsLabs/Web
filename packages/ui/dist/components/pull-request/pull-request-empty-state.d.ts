import { type DomainFrameProps } from '../../internal/domain.js';
export interface PullRequestEmptyStateProps extends Omit<DomainFrameProps, 'children' | 'onSelect' | 'onChange' | 'onSubmit'> {
    message?: string;
    actionLabel?: string;
    onAction?: () => void;
}
export declare function PullRequestEmptyState(props: PullRequestEmptyStateProps): import("react").JSX.Element;
