import { type DomainFrameProps } from '../../internal/domain.js';
import type { FeatureFlag, FeatureFlagMetric } from './types.js';
export interface FeatureFlagOverviewProps extends Omit<DomainFrameProps, 'children' | 'onSelect' | 'onChange' | 'onSubmit'> {
    items: readonly FeatureFlag[];
    metrics: readonly FeatureFlagMetric[];
}
export declare function FeatureFlagOverview(props: FeatureFlagOverviewProps): import("react").JSX.Element;
