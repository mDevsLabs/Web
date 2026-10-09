import { type DomainFrameProps } from '../../internal/domain.js';
import type { HotelRoomMetric } from './types.js';
export interface HotelRoomStatsProps extends Omit<DomainFrameProps, 'children' | 'onSelect' | 'onChange' | 'onSubmit'> {
    metrics: readonly HotelRoomMetric[];
}
export declare function HotelRoomStats(props: HotelRoomStatsProps): import("react").JSX.Element;
