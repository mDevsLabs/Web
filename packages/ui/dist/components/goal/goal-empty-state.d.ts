import { type DomainFrameProps } from '../../internal/domain.js';
export interface GoalEmptyStateProps extends Omit<DomainFrameProps, 'children' | 'onSelect' | 'onChange' | 'onSubmit'> {
    message?: string;
    actionLabel?: string;
    onAction?: () => void;
}
export declare function GoalEmptyState(props: GoalEmptyStateProps): import("react").JSX.Element;
