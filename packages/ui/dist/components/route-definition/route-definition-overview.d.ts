import { type DomainFrameProps } from '../../internal/domain.js';
import type { RouteDefinition, RouteDefinitionMetric } from './types.js';
export interface RouteDefinitionOverviewProps extends Omit<DomainFrameProps, 'children' | 'onSelect' | 'onChange' | 'onSubmit'> {
    items: readonly RouteDefinition[];
    metrics: readonly RouteDefinitionMetric[];
}
export declare function RouteDefinitionOverview(props: RouteDefinitionOverviewProps): import("react").JSX.Element;
