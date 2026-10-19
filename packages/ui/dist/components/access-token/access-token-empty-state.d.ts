import { type DomainFrameProps } from '../../internal/domain.js';
export interface AccessTokenEmptyStateProps extends Omit<DomainFrameProps, 'children' | 'onSelect' | 'onChange' | 'onSubmit'> {
    message?: string;
    actionLabel?: string;
    onAction?: () => void;
}
export declare function AccessTokenEmptyState(props: AccessTokenEmptyStateProps): import("react").JSX.Element;
