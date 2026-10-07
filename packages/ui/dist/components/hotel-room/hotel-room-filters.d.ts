import { type DomainFrameProps } from '../../internal/domain.js';
import type { HotelRoomStatus } from './types.js';
export interface HotelRoomFiltersProps extends Omit<DomainFrameProps, 'children' | 'onSelect' | 'onChange' | 'onSubmit'> {
    query: string;
    status?: HotelRoomStatus | '';
    onQueryChange: (query: string) => void;
    onStatusChange?: (status: HotelRoomStatus | '') => void;
}
export declare function HotelRoomFilters({ onStatusChange, ...props }: HotelRoomFiltersProps): import("react").JSX.Element;
