import { type DomainFrameProps } from '../../internal/domain.js';
import type { Event } from './types.js';
export interface EventTableProps extends Omit<DomainFrameProps, 'children' | 'onSelect' | 'onChange' | 'onSubmit'> {
    items: readonly Event[];
    emptyMessage?: string;
}
export declare function EventTable(props: EventTableProps): import("react").JSX.Element;
