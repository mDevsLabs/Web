import { type DomainFrameProps } from '../../internal/domain.js';
import type { PaymentActivity } from './types.js';
export interface PaymentTimelineProps extends Omit<DomainFrameProps, 'children' | 'onSelect' | 'onChange' | 'onSubmit'> {
    events: readonly PaymentActivity[];
    emptyMessage?: string;
}
export declare function PaymentTimeline(props: PaymentTimelineProps): import("react").JSX.Element;
