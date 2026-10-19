import { type DomainFrameProps } from '../../internal/domain.js';
import type { Reservation } from './types.js';
export interface ReservationTableProps extends Omit<DomainFrameProps, 'children' | 'onSelect' | 'onChange' | 'onSubmit'> {
    items: readonly Reservation[];
    emptyMessage?: string;
}
export declare function ReservationTable(props: ReservationTableProps): import("react").JSX.Element;
