import { type DomainFrameProps } from '../../internal/domain.js';
export interface DatabaseEmptyStateProps extends Omit<DomainFrameProps, 'children' | 'onSelect' | 'onChange' | 'onSubmit'> {
    message?: string;
    actionLabel?: string;
    onAction?: () => void;
}
export declare function DatabaseEmptyState(props: DatabaseEmptyStateProps): import("react").JSX.Element;
