import { type DomainFrameProps } from '../../internal/domain.js';
import type { IntegrationMetric } from './types.js';
export interface IntegrationStatsProps extends Omit<DomainFrameProps, 'children' | 'onSelect' | 'onChange' | 'onSubmit'> {
    metrics: readonly IntegrationMetric[];
}
export declare function IntegrationStats(props: IntegrationStatsProps): import("react").JSX.Element;
