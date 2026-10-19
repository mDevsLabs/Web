import { type DomainFrameProps } from '../../internal/domain.js';
import type { Reservation } from './types.js';
export interface ReservationCardProps extends Omit<DomainFrameProps, 'children' | 'onSelect' | 'onChange' | 'onSubmit'> {
    item: Reservation;
}
export declare function ReservationCard(props: ReservationCardProps): import("react").JSX.Element;
