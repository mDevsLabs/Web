import { type DomainFrameProps } from '../../internal/domain.js';
import type { Reservation } from './types.js';
export interface ReservationListProps extends Omit<DomainFrameProps, 'children' | 'onSelect' | 'onChange' | 'onSubmit'> {
    items: readonly Reservation[];
    onSelect?: (item: Reservation) => void;
    emptyMessage?: string;
}
export declare function ReservationList({ onSelect, ...props }: ReservationListProps): import("react").JSX.Element;
