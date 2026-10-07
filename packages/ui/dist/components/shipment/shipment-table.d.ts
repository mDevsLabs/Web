import { type DomainFrameProps } from '../../internal/domain.js';
import type { Shipment } from './types.js';
export interface ShipmentTableProps extends Omit<DomainFrameProps, 'children' | 'onSelect' | 'onChange' | 'onSubmit'> {
    items: readonly Shipment[];
    emptyMessage?: string;
}
export declare function ShipmentTable(props: ShipmentTableProps): import("react").JSX.Element;
