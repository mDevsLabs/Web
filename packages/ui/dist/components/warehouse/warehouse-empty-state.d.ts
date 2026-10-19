import { type DomainFrameProps } from '../../internal/domain.js';
export interface WarehouseEmptyStateProps extends Omit<DomainFrameProps, 'children' | 'onSelect' | 'onChange' | 'onSubmit'> {
    message?: string;
    actionLabel?: string;
    onAction?: () => void;
}
export declare function WarehouseEmptyState(props: WarehouseEmptyStateProps): import("react").JSX.Element;
