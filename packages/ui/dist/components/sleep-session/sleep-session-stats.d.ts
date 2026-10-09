import { type DomainFrameProps } from '../../internal/domain.js';
import type { SleepSessionMetric } from './types.js';
export interface SleepSessionStatsProps extends Omit<DomainFrameProps, 'children' | 'onSelect' | 'onChange' | 'onSubmit'> {
    metrics: readonly SleepSessionMetric[];
}
export declare function SleepSessionStats(props: SleepSessionStatsProps): import("react").JSX.Element;
