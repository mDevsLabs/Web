import { type DomainFrameProps } from '../../internal/domain.js';
import type { HotelRoomActivity } from './types.js';
export interface HotelRoomTimelineProps extends Omit<DomainFrameProps, 'children' | 'onSelect' | 'onChange' | 'onSubmit'> {
    events: readonly HotelRoomActivity[];
    emptyMessage?: string;
}
export declare function HotelRoomTimeline(props: HotelRoomTimelineProps): import("react").JSX.Element;
