import { type DomainFrameProps } from '../../internal/domain.js';
export interface ProductEmptyStateProps extends Omit<DomainFrameProps, 'children' | 'onSelect' | 'onChange' | 'onSubmit'> {
    message?: string;
    actionLabel?: string;
    onAction?: () => void;
}
export declare function ProductEmptyState(props: ProductEmptyStateProps): import("react").JSX.Element;
