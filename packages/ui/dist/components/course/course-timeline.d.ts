import { type DomainFrameProps } from '../../internal/domain.js';
import type { CourseActivity } from './types.js';
export interface CourseTimelineProps extends Omit<DomainFrameProps, 'children' | 'onSelect' | 'onChange' | 'onSubmit'> {
    events: readonly CourseActivity[];
    emptyMessage?: string;
}
export declare function CourseTimeline(props: CourseTimelineProps): import("react").JSX.Element;
