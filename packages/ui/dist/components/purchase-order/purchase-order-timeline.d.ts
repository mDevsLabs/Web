import { type DomainFrameProps } from '../../internal/domain.js';
import type { PurchaseOrderActivity } from './types.js';
export interface PurchaseOrderTimelineProps extends Omit<DomainFrameProps, 'children' | 'onSelect' | 'onChange' | 'onSubmit'> {
    events: readonly PurchaseOrderActivity[];
    emptyMessage?: string;
}
export declare function PurchaseOrderTimeline(props: PurchaseOrderTimelineProps): import("react").JSX.Element;
