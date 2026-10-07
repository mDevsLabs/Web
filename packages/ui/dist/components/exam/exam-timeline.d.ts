import { type DomainFrameProps } from '../../internal/domain.js';
import type { ExamActivity } from './types.js';
export interface ExamTimelineProps extends Omit<DomainFrameProps, 'children' | 'onSelect' | 'onChange' | 'onSubmit'> {
    events: readonly ExamActivity[];
    emptyMessage?: string;
}
export declare function ExamTimeline(props: ExamTimelineProps): import("react").JSX.Element;
