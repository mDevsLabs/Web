import { type DomainFrameProps } from '../../internal/domain.js';
export interface ReviewEmptyStateProps extends Omit<DomainFrameProps, 'children' | 'onSelect' | 'onChange' | 'onSubmit'> {
    message?: string;
    actionLabel?: string;
    onAction?: () => void;
}
export declare function ReviewEmptyState(props: ReviewEmptyStateProps): import("react").JSX.Element;
