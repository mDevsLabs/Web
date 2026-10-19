import { type DomainFrameProps } from '../../internal/domain.js';
import type { Calendar, CalendarMetric } from './types.js';
export interface CalendarOverviewProps extends Omit<DomainFrameProps, 'children' | 'onSelect' | 'onChange' | 'onSubmit'> {
    items: readonly Calendar[];
    metrics: readonly CalendarMetric[];
}
export declare function CalendarOverview(props: CalendarOverviewProps): import("react").JSX.Element;
