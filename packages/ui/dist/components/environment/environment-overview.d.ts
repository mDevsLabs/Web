import { type DomainFrameProps } from '../../internal/domain.js';
import type { Environment, EnvironmentMetric } from './types.js';
export interface EnvironmentOverviewProps extends Omit<DomainFrameProps, 'children' | 'onSelect' | 'onChange' | 'onSubmit'> {
    items: readonly Environment[];
    metrics: readonly EnvironmentMetric[];
}
export declare function EnvironmentOverview(props: EnvironmentOverviewProps): import("react").JSX.Element;
