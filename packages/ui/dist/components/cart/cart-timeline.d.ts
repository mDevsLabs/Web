import { type DomainFrameProps } from '../../internal/domain.js';
import type { CartActivity } from './types.js';
export interface CartTimelineProps extends Omit<DomainFrameProps, 'children' | 'onSelect' | 'onChange' | 'onSubmit'> {
    events: readonly CartActivity[];
    emptyMessage?: string;
}
export declare function CartTimeline(props: CartTimelineProps): import("react").JSX.Element;
