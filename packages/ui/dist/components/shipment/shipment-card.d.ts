import { type DomainFrameProps } from '../../internal/domain.js';
import type { Shipment } from './types.js';
export interface ShipmentCardProps extends Omit<DomainFrameProps, 'children' | 'onSelect' | 'onChange' | 'onSubmit'> {
    item: Shipment;
}
export declare function ShipmentCard(props: ShipmentCardProps): import("react").JSX.Element;
