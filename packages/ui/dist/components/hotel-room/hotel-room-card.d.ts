import { type DomainFrameProps } from '../../internal/domain.js';
import type { HotelRoom } from './types.js';
export interface HotelRoomCardProps extends Omit<DomainFrameProps, 'children' | 'onSelect' | 'onChange' | 'onSubmit'> {
    item: HotelRoom;
}
export declare function HotelRoomCard(props: HotelRoomCardProps): import("react").JSX.Element;
