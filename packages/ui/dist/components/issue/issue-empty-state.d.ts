import { type DomainFrameProps } from '../../internal/domain.js';
export interface IssueEmptyStateProps extends Omit<DomainFrameProps, 'children' | 'onSelect' | 'onChange' | 'onSubmit'> {
    message?: string;
    actionLabel?: string;
    onAction?: () => void;
}
export declare function IssueEmptyState(props: IssueEmptyStateProps): import("react").JSX.Element;
