import { type DomainFrameProps } from '../../internal/domain.js';
export interface TagEmptyStateProps extends Omit<DomainFrameProps, 'children' | 'onSelect' | 'onChange' | 'onSubmit'> {
    message?: string;
    actionLabel?: string;
    onAction?: () => void;
}
export declare function TagEmptyState(props: TagEmptyStateProps): import("react").JSX.Element;
