import { type DomainFrameProps } from '../../internal/domain.js';
import type { ProjectActivity } from './types.js';
export interface ProjectTimelineProps extends Omit<DomainFrameProps, 'children' | 'onSelect' | 'onChange' | 'onSubmit'> {
    events: readonly ProjectActivity[];
    emptyMessage?: string;
}
export declare function ProjectTimeline(props: ProjectTimelineProps): import("react").JSX.Element;
