import { type DomainFrameProps } from '../../internal/domain.js';
import type { FeatureFlagMetric } from './types.js';
export interface FeatureFlagStatsProps extends Omit<DomainFrameProps, 'children' | 'onSelect' | 'onChange' | 'onSubmit'> {
    metrics: readonly FeatureFlagMetric[];
}
export declare function FeatureFlagStats(props: FeatureFlagStatsProps): import("react").JSX.Element;
