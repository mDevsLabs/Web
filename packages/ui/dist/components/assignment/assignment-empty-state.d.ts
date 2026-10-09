import { type DomainFrameProps } from '../../internal/domain.js';
export interface AssignmentEmptyStateProps extends Omit<DomainFrameProps, 'children' | 'onSelect' | 'onChange' | 'onSubmit'> {
    message?: string;
    actionLabel?: string;
    onAction?: () => void;
}
export declare function AssignmentEmptyState(props: AssignmentEmptyStateProps): import("react").JSX.Element;
