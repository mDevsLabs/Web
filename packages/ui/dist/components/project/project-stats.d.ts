import { type DomainFrameProps } from '../../internal/domain.js';
import type { ProjectMetric } from './types.js';
export interface ProjectStatsProps extends Omit<DomainFrameProps, 'children' | 'onSelect' | 'onChange' | 'onSubmit'> {
    metrics: readonly ProjectMetric[];
}
export declare function ProjectStats(props: ProjectStatsProps): import("react").JSX.Element;
