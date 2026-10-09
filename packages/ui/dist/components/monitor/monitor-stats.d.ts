import { type DomainFrameProps } from '../../internal/domain.js';
import type { MonitorMetric } from './types.js';
export interface MonitorStatsProps extends Omit<DomainFrameProps, 'children' | 'onSelect' | 'onChange' | 'onSubmit'> {
    metrics: readonly MonitorMetric[];
}
export declare function MonitorStats(props: MonitorStatsProps): import("react").JSX.Element;
