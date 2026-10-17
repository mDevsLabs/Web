import { type DomainFrameProps } from '../../internal/domain.js';
import type { Calendar } from './types.js';
export interface CalendarTableProps extends Omit<DomainFrameProps, 'children' | 'onSelect' | 'onChange' | 'onSubmit'> {
    items: readonly Calendar[];
    emptyMessage?: string;
}
export declare function CalendarTable(props: CalendarTableProps): import("react").JSX.Element;
