import { type DomainFrameProps } from '../../internal/domain.js';
import type { Flight } from './types.js';
export interface FlightTableProps extends Omit<DomainFrameProps, 'children' | 'onSelect' | 'onChange' | 'onSubmit'> {
    items: readonly Flight[];
    emptyMessage?: string;
}
export declare function FlightTable(props: FlightTableProps): import("react").JSX.Element;
