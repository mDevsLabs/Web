import { type DomainFrameProps } from '../../internal/domain.js';
import type { HotelRoom } from './types.js';
export interface HotelRoomListProps extends Omit<DomainFrameProps, 'children' | 'onSelect' | 'onChange' | 'onSubmit'> {
    items: readonly HotelRoom[];
    onSelect?: (item: HotelRoom) => void;
    emptyMessage?: string;
}
export declare function HotelRoomList({ onSelect, ...props }: HotelRoomListProps): import("react").JSX.Element;
