import { type DomainFrameProps } from '../../internal/domain.js';
import type { LessonMetric } from './types.js';
export interface LessonStatsProps extends Omit<DomainFrameProps, 'children' | 'onSelect' | 'onChange' | 'onSubmit'> {
    metrics: readonly LessonMetric[];
}
export declare function LessonStats(props: LessonStatsProps): import("react").JSX.Element;
