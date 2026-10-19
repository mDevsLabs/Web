import { type DomainFrameProps } from '../../internal/domain.js';
export interface LessonEmptyStateProps extends Omit<DomainFrameProps, 'children' | 'onSelect' | 'onChange' | 'onSubmit'> {
    message?: string;
    actionLabel?: string;
    onAction?: () => void;
}
export declare function LessonEmptyState(props: LessonEmptyStateProps): import("react").JSX.Element;
