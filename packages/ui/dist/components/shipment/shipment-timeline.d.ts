import { type DomainFrameProps } from '../../internal/domain.js';
import type { ShipmentActivity } from './types.js';
export interface ShipmentTimelineProps extends Omit<DomainFrameProps, 'children' | 'onSelect' | 'onChange' | 'onSubmit'> {
    events: readonly ShipmentActivity[];
    emptyMessage?: string;
}
export declare function ShipmentTimeline(props: ShipmentTimelineProps): import("react").JSX.Element;
