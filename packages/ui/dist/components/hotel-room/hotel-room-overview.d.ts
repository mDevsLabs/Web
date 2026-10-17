import { type DomainFrameProps } from '../../internal/domain.js';
import type { HotelRoom, HotelRoomMetric } from './types.js';
export interface HotelRoomOverviewProps extends Omit<DomainFrameProps, 'children' | 'onSelect' | 'onChange' | 'onSubmit'> {
    items: readonly HotelRoom[];
    metrics: readonly HotelRoomMetric[];
}
export declare function HotelRoomOverview(props: HotelRoomOverviewProps): import("react").JSX.Element;
