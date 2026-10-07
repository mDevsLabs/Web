import { type DomainFrameProps } from '../../internal/domain.js';
import type { Flight } from './types.js';
export interface FlightListProps extends Omit<DomainFrameProps, 'children' | 'onSelect' | 'onChange' | 'onSubmit'> {
    items: readonly Flight[];
    onSelect?: (item: Flight) => void;
    emptyMessage?: string;
}
export declare function FlightList({ onSelect, ...props }: FlightListProps): import("react").JSX.Element;
