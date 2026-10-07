import { type DomainFrameProps } from '../../internal/domain.js';
import type { Booking } from './types.js';
export interface BookingTableProps extends Omit<DomainFrameProps, 'children' | 'onSelect' | 'onChange' | 'onSubmit'> {
    items: readonly Booking[];
    emptyMessage?: string;
}
export declare function BookingTable(props: BookingTableProps): import("react").JSX.Element;
