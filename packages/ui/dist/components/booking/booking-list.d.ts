import { type DomainFrameProps } from '../../internal/domain.js';
import type { Booking } from './types.js';
export interface BookingListProps extends Omit<DomainFrameProps, 'children' | 'onSelect' | 'onChange' | 'onSubmit'> {
    items: readonly Booking[];
    onSelect?: (item: Booking) => void;
    emptyMessage?: string;
}
export declare function BookingList({ onSelect, ...props }: BookingListProps): import("react").JSX.Element;
