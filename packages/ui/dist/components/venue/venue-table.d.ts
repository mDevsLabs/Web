import { type DomainFrameProps } from '../../internal/domain.js';
import type { Venue } from './types.js';
export interface VenueTableProps extends Omit<DomainFrameProps, 'children' | 'onSelect' | 'onChange' | 'onSubmit'> {
    items: readonly Venue[];
    emptyMessage?: string;
}
export declare function VenueTable(props: VenueTableProps): import("react").JSX.Element;
