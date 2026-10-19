import { type DomainFrameProps } from '../../internal/domain.js';
export interface WorkoutEmptyStateProps extends Omit<DomainFrameProps, 'children' | 'onSelect' | 'onChange' | 'onSubmit'> {
    message?: string;
    actionLabel?: string;
    onAction?: () => void;
}
export declare function WorkoutEmptyState(props: WorkoutEmptyStateProps): import("react").JSX.Element;
