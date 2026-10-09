import { type DomainFrameProps } from '../../internal/domain.js';
export interface CustomerEmptyStateProps extends Omit<DomainFrameProps, 'children' | 'onSelect' | 'onChange' | 'onSubmit'> {
    message?: string;
    actionLabel?: string;
    onAction?: () => void;
}
export declare function CustomerEmptyState(props: CustomerEmptyStateProps): import("react").JSX.Element;
