import { type DomainFrameProps } from '../../internal/domain.js';
import type { DeploymentMetric } from './types.js';
export interface DeploymentStatsProps extends Omit<DomainFrameProps, 'children' | 'onSelect' | 'onChange' | 'onSubmit'> {
    metrics: readonly DeploymentMetric[];
}
export declare function DeploymentStats(props: DeploymentStatsProps): import("react").JSX.Element;
