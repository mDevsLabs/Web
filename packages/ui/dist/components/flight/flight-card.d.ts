import { type DomainFrameProps } from '../../internal/domain.js';
import type { Flight } from './types.js';
export interface FlightCardProps extends Omit<DomainFrameProps, 'children' | 'onSelect' | 'onChange' | 'onSubmit'> {
    item: Flight;
}
export declare function FlightCard(props: FlightCardProps): import("react").JSX.Element;
