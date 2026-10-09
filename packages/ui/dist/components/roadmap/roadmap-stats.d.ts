import { type DomainFrameProps } from '../../internal/domain.js';
import type { RoadmapMetric } from './types.js';
export interface RoadmapStatsProps extends Omit<DomainFrameProps, 'children' | 'onSelect' | 'onChange' | 'onSubmit'> {
    metrics: readonly RoadmapMetric[];
}
export declare function RoadmapStats(props: RoadmapStatsProps): import("react").JSX.Element;
