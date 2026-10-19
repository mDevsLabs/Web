import { type DomainFrameProps } from '../../internal/domain.js';
export interface ShipmentEmptyStateProps extends Omit<DomainFrameProps, 'children' | 'onSelect' | 'onChange' | 'onSubmit'> {
    message?: string;
    actionLabel?: string;
    onAction?: () => void;
}
export declare function ShipmentEmptyState(props: ShipmentEmptyStateProps): import("react").JSX.Element;
