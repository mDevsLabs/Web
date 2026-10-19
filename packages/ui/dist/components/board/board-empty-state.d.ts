import { type DomainFrameProps } from '../../internal/domain.js';
export interface BoardEmptyStateProps extends Omit<DomainFrameProps, 'children' | 'onSelect' | 'onChange' | 'onSubmit'> {
    message?: string;
    actionLabel?: string;
    onAction?: () => void;
}
export declare function BoardEmptyState(props: BoardEmptyStateProps): import("react").JSX.Element;
