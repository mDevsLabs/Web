import { type DomainFrameProps } from '../../internal/domain.js';
import type { Project, ProjectMetric } from './types.js';
export interface ProjectOverviewProps extends Omit<DomainFrameProps, 'children' | 'onSelect' | 'onChange' | 'onSubmit'> {
    items: readonly Project[];
    metrics: readonly ProjectMetric[];
}
export declare function ProjectOverview(props: ProjectOverviewProps): import("react").JSX.Element;
