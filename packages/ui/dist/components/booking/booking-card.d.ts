import { type DomainFrameProps } from '../../internal/domain.js';
import type { Booking } from './types.js';
export interface BookingCardProps extends Omit<DomainFrameProps, 'children' | 'onSelect' | 'onChange' | 'onSubmit'> {
    item: Booking;
}
export declare function BookingCard(props: BookingCardProps): import("react").JSX.Element;
