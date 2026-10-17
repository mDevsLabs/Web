import { type DomainFrameProps } from '../../internal/domain.js';
import type { Shipment, ShipmentMetric } from './types.js';
export interface ShipmentOverviewProps extends Omit<DomainFrameProps, 'children' | 'onSelect' | 'onChange' | 'onSubmit'> {
    items: readonly Shipment[];
    metrics: readonly ShipmentMetric[];
}
export declare function ShipmentOverview(props: ShipmentOverviewProps): import("react").JSX.Element;
