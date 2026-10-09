import { type DomainFrameProps } from '../../internal/domain.js';
import type { Calendar } from './types.js';
export interface CalendarCardProps extends Omit<DomainFrameProps, 'children' | 'onSelect' | 'onChange' | 'onSubmit'> {
    item: Calendar;
}
export declare function CalendarCard(props: CalendarCardProps): import("react").JSX.Element;
