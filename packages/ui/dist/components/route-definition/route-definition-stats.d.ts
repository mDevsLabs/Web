import { type DomainFrameProps } from '../../internal/domain.js';
import type { RouteDefinitionMetric } from './types.js';
export interface RouteDefinitionStatsProps extends Omit<DomainFrameProps, 'children' | 'onSelect' | 'onChange' | 'onSubmit'> {
    metrics: readonly RouteDefinitionMetric[];
}
export declare function RouteDefinitionStats(props: RouteDefinitionStatsProps): import("react").JSX.Element;
