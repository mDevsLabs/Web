import { type DomainFrameProps } from '../../internal/domain.js';
import type { SupplierActivity } from './types.js';
export interface SupplierTimelineProps extends Omit<DomainFrameProps, 'children' | 'onSelect' | 'onChange' | 'onSubmit'> {
    events: readonly SupplierActivity[];
    emptyMessage?: string;
}
export declare function SupplierTimeline(props: SupplierTimelineProps): import("react").JSX.Element;
