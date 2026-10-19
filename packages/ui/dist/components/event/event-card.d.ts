import { type DomainFrameProps } from '../../internal/domain.js';
import type { Event } from './types.js';
export interface EventCardProps extends Omit<DomainFrameProps, 'children' | 'onSelect' | 'onChange' | 'onSubmit'> {
    item: Event;
}
export declare function EventCard(props: EventCardProps): import("react").JSX.Element;
