import { type DomainFrameProps } from '../../internal/domain.js';
import type { EnvironmentMetric } from './types.js';
export interface EnvironmentStatsProps extends Omit<DomainFrameProps, 'children' | 'onSelect' | 'onChange' | 'onSubmit'> {
    metrics: readonly EnvironmentMetric[];
}
export declare function EnvironmentStats(props: EnvironmentStatsProps): import("react").JSX.Element;
