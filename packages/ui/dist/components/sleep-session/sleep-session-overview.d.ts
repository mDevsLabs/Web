import { type DomainFrameProps } from '../../internal/domain.js';
import type { SleepSession, SleepSessionMetric } from './types.js';
export interface SleepSessionOverviewProps extends Omit<DomainFrameProps, 'children' | 'onSelect' | 'onChange' | 'onSubmit'> {
    items: readonly SleepSession[];
    metrics: readonly SleepSessionMetric[];
}
export declare function SleepSessionOverview(props: SleepSessionOverviewProps): import("react").JSX.Element;
