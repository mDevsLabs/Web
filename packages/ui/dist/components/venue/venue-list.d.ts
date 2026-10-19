import { type DomainFrameProps } from '../../internal/domain.js';
import type { Venue } from './types.js';
export interface VenueListProps extends Omit<DomainFrameProps, 'children' | 'onSelect' | 'onChange' | 'onSubmit'> {
    items: readonly Venue[];
    onSelect?: (item: Venue) => void;
    emptyMessage?: string;
}
export declare function VenueList({ onSelect, ...props }: VenueListProps): import("react").JSX.Element;
