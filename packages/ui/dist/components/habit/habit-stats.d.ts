import { type DomainFrameProps } from '../../internal/domain.js';
import type { HabitMetric } from './types.js';
export interface HabitStatsProps extends Omit<DomainFrameProps, 'children' | 'onSelect' | 'onChange' | 'onSubmit'> {
    metrics: readonly HabitMetric[];
}
export declare function HabitStats(props: HabitStatsProps): import("react").JSX.Element;
