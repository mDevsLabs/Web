import { type DomainFrameProps } from '../../internal/domain.js';
import type { Destination } from './types.js';
export interface DestinationTableProps extends Omit<DomainFrameProps, 'children' | 'onSelect' | 'onChange' | 'onSubmit'> {
    items: readonly Destination[];
    emptyMessage?: string;
}
export declare function DestinationTable(props: DestinationTableProps): import("react").JSX.Element;
