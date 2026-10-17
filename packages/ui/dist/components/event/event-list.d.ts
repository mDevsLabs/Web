import { type DomainFrameProps } from '../../internal/domain.js';
import type { Event } from './types.js';
export interface EventListProps extends Omit<DomainFrameProps, 'children' | 'onSelect' | 'onChange' | 'onSubmit'> {
    items: readonly Event[];
    onSelect?: (item: Event) => void;
    emptyMessage?: string;
}
export declare function EventList({ onSelect, ...props }: EventListProps): import("react").JSX.Element;
