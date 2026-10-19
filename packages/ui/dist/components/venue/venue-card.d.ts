import { type DomainFrameProps } from '../../internal/domain.js';
import type { Venue } from './types.js';
export interface VenueCardProps extends Omit<DomainFrameProps, 'children' | 'onSelect' | 'onChange' | 'onSubmit'> {
    item: Venue;
}
export declare function VenueCard(props: VenueCardProps): import("react").JSX.Element;
