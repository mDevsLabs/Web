import { type DomainFrameProps } from '../../internal/domain.js';
export interface DocumentEmptyStateProps extends Omit<DomainFrameProps, 'children' | 'onSelect' | 'onChange' | 'onSubmit'> {
    message?: string;
    actionLabel?: string;
    onAction?: () => void;
}
export declare function DocumentEmptyState(props: DocumentEmptyStateProps): import("react").JSX.Element;
