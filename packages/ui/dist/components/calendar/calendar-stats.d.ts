import { type DomainFrameProps } from '../../internal/domain.js';
import type { CalendarMetric } from './types.js';
export interface CalendarStatsProps extends Omit<DomainFrameProps, 'children' | 'onSelect' | 'onChange' | 'onSubmit'> {
    metrics: readonly CalendarMetric[];
}
export declare function CalendarStats(props: CalendarStatsProps): import("react").JSX.Element;
