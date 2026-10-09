import { type DomainFrameProps } from '../../internal/domain.js';
import type { Destination } from './types.js';
export interface DestinationCardProps extends Omit<DomainFrameProps, 'children' | 'onSelect' | 'onChange' | 'onSubmit'> {
    item: Destination;
}
export declare function DestinationCard(props: DestinationCardProps): import("react").JSX.Element;
