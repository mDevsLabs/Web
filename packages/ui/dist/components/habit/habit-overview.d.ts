import { type DomainFrameProps } from '../../internal/domain.js';
import type { Habit, HabitMetric } from './types.js';
export interface HabitOverviewProps extends Omit<DomainFrameProps, 'children' | 'onSelect' | 'onChange' | 'onSubmit'> {
    items: readonly Habit[];
    metrics: readonly HabitMetric[];
}
export declare function HabitOverview(props: HabitOverviewProps): import("react").JSX.Element;
