import { type DomainFrameProps } from '../../internal/domain.js';
import type { InventoryActivity } from './types.js';
export interface InventoryTimelineProps extends Omit<DomainFrameProps, 'children' | 'onSelect' | 'onChange' | 'onSubmit'> {
    events: readonly InventoryActivity[];
    emptyMessage?: string;
}
export declare function InventoryTimeline(props: InventoryTimelineProps): import("react").JSX.Element;
