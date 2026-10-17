import { type DomainFrameProps } from '../../internal/domain.js';
import type { Deployment, DeploymentMetric } from './types.js';
export interface DeploymentOverviewProps extends Omit<DomainFrameProps, 'children' | 'onSelect' | 'onChange' | 'onSubmit'> {
    items: readonly Deployment[];
    metrics: readonly DeploymentMetric[];
}
export declare function DeploymentOverview(props: DeploymentOverviewProps): import("react").JSX.Element;
