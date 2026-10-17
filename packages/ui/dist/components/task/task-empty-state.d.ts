import { type DomainFrameProps } from '../../internal/domain.js';
export interface TaskEmptyStateProps extends Omit<DomainFrameProps, 'children' | 'onSelect' | 'onChange' | 'onSubmit'> {
    message?: string;
    actionLabel?: string;
    onAction?: () => void;
}
export declare function TaskEmptyState(props: TaskEmptyStateProps): import("react").JSX.Element;
