import { type DomainFrameProps } from '../../internal/domain.js';
import type { WarehouseActivity } from './types.js';
export interface WarehouseTimelineProps extends Omit<DomainFrameProps, 'children' | 'onSelect' | 'onChange' | 'onSubmit'> {
    events: readonly WarehouseActivity[];
    emptyMessage?: string;
}
export declare function WarehouseTimeline(props: WarehouseTimelineProps): import("react").JSX.Element;
