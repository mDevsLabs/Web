import { type DomainFrameProps } from '../../internal/domain.js';
import type { Calendar } from './types.js';
export interface CalendarListProps extends Omit<DomainFrameProps, 'children' | 'onSelect' | 'onChange' | 'onSubmit'> {
    items: readonly Calendar[];
    onSelect?: (item: Calendar) => void;
    emptyMessage?: string;
}
export declare function CalendarList({ onSelect, ...props }: CalendarListProps): import("react").JSX.Element;
