import { type DomainFrameProps } from '../../internal/domain.js';
import type { HotelRoom } from './types.js';
export interface HotelRoomTableProps extends Omit<DomainFrameProps, 'children' | 'onSelect' | 'onChange' | 'onSubmit'> {
    items: readonly HotelRoom[];
    emptyMessage?: string;
}
export declare function HotelRoomTable(props: HotelRoomTableProps): import("react").JSX.Element;
