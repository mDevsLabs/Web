import { type DomainFrameProps } from '../../internal/domain.js';
import type { ProductActivity } from './types.js';
export interface ProductTimelineProps extends Omit<DomainFrameProps, 'children' | 'onSelect' | 'onChange' | 'onSubmit'> {
    events: readonly ProductActivity[];
    emptyMessage?: string;
}
export declare function ProductTimeline(props: ProductTimelineProps): import("react").JSX.Element;
