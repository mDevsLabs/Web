import { type DomainFrameProps } from '../../internal/domain.js';
import type { ReservationActivity } from './types.js';
export interface ReservationTimelineProps extends Omit<DomainFrameProps, 'children' | 'onSelect' | 'onChange' | 'onSubmit'> {
    events: readonly ReservationActivity[];
    emptyMessage?: string;
}
export declare function ReservationTimeline(props: ReservationTimelineProps): import("react").JSX.Element;
