import { type DomainFrameProps } from '../../internal/domain.js';
export interface SupplierEmptyStateProps extends Omit<DomainFrameProps, 'children' | 'onSelect' | 'onChange' | 'onSubmit'> {
    message?: string;
    actionLabel?: string;
    onAction?: () => void;
}
export declare function SupplierEmptyState(props: SupplierEmptyStateProps): import("react").JSX.Element;
