import { type DomainFrameProps } from '../../internal/domain.js';
export interface ReturnEmptyStateProps extends Omit<DomainFrameProps, 'children' | 'onSelect' | 'onChange' | 'onSubmit'> {
    message?: string;
    actionLabel?: string;
    onAction?: () => void;
}
export declare function ReturnEmptyState(props: ReturnEmptyStateProps): import("react").JSX.Element;
