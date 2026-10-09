import { type DomainFrameProps } from '../../internal/domain.js';
export interface TeamEmptyStateProps extends Omit<DomainFrameProps, 'children' | 'onSelect' | 'onChange' | 'onSubmit'> {
    message?: string;
    actionLabel?: string;
    onAction?: () => void;
}
export declare function TeamEmptyState(props: TeamEmptyStateProps): import("react").JSX.Element;
