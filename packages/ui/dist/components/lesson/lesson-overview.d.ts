import { type DomainFrameProps } from '../../internal/domain.js';
import type { Lesson, LessonMetric } from './types.js';
export interface LessonOverviewProps extends Omit<DomainFrameProps, 'children' | 'onSelect' | 'onChange' | 'onSubmit'> {
    items: readonly Lesson[];
    metrics: readonly LessonMetric[];
}
export declare function LessonOverview(props: LessonOverviewProps): import("react").JSX.Element;
