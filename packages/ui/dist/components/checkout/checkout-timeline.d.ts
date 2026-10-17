import { type DomainFrameProps } from '../../internal/domain.js';
import type { CheckoutActivity } from './types.js';
export interface CheckoutTimelineProps extends Omit<DomainFrameProps, 'children' | 'onSelect' | 'onChange' | 'onSubmit'> {
    events: readonly CheckoutActivity[];
    emptyMessage?: string;
}
export declare function CheckoutTimeline(props: CheckoutTimelineProps): import("react").JSX.Element;
