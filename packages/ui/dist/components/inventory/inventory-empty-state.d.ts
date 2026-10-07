import { type DomainFrameProps } from '../../internal/domain.js';
export interface InventoryEmptyStateProps extends Omit<DomainFrameProps, 'children' | 'onSelect' | 'onChange' | 'onSubmit'> {
    message?: string;
    actionLabel?: string;
    onAction?: () => void;
}
export declare function InventoryEmptyState(props: InventoryEmptyStateProps): import("react").JSX.Element;
