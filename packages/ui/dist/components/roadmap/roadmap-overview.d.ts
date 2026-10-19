import { type DomainFrameProps } from '../../internal/domain.js';
import type { Roadmap, RoadmapMetric } from './types.js';
export interface RoadmapOverviewProps extends Omit<DomainFrameProps, 'children' | 'onSelect' | 'onChange' | 'onSubmit'> {
    items: readonly Roadmap[];
    metrics: readonly RoadmapMetric[];
}
export declare function RoadmapOverview(props: RoadmapOverviewProps): import("react").JSX.Element;
