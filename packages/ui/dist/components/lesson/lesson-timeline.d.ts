import { type DomainFrameProps } from '../../internal/domain.js';
import type { LessonActivity } from './types.js';
export interface LessonTimelineProps extends Omit<DomainFrameProps, 'children' | 'onSelect' | 'onChange' | 'onSubmit'> {
    events: readonly LessonActivity[];
    emptyMessage?: string;
}
export declare function LessonTimeline(props: LessonTimelineProps): import("react").JSX.Element;
