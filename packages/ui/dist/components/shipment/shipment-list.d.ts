import { type DomainFrameProps } from '../../internal/domain.js';
import type { Shipment } from './types.js';
export interface ShipmentListProps extends Omit<DomainFrameProps, 'children' | 'onSelect' | 'onChange' | 'onSubmit'> {
    items: readonly Shipment[];
    onSelect?: (item: Shipment) => void;
    emptyMessage?: string;
}
export declare function ShipmentList({ onSelect, ...props }: ShipmentListProps): import("react").JSX.Element;
