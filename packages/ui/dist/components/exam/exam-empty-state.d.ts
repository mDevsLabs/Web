import { type DomainFrameProps } from '../../internal/domain.js';
export interface ExamEmptyStateProps extends Omit<DomainFrameProps, 'children' | 'onSelect' | 'onChange' | 'onSubmit'> {
    message?: string;
    actionLabel?: string;
    onAction?: () => void;
}
export declare function ExamEmptyState(props: ExamEmptyStateProps): import("react").JSX.Element;
