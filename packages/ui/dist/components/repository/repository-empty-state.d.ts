import { type DomainFrameProps } from '../../internal/domain.js';
export interface RepositoryEmptyStateProps extends Omit<DomainFrameProps, 'children' | 'onSelect' | 'onChange' | 'onSubmit'> {
    message?: string;
    actionLabel?: string;
    onAction?: () => void;
}
export declare function RepositoryEmptyState(props: RepositoryEmptyStateProps): import("react").JSX.Element;
