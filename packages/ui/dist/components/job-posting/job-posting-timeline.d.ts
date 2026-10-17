import { type DomainFrameProps } from '../../internal/domain.js';
import type { JobPostingActivity } from './types.js';
export interface JobPostingTimelineProps extends Omit<DomainFrameProps, 'children' | 'onSelect' | 'onChange' | 'onSubmit'> {
    events: readonly JobPostingActivity[];
    emptyMessage?: string;
}
export declare function JobPostingTimeline(props: JobPostingTimelineProps): import("react").JSX.Element;
