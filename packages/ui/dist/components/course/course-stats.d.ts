import { type DomainFrameProps } from '../../internal/domain.js';
import type { CourseMetric } from './types.js';
export interface CourseStatsProps extends Omit<DomainFrameProps, 'children' | 'onSelect' | 'onChange' | 'onSubmit'> {
    metrics: readonly CourseMetric[];
}
export declare function CourseStats(props: CourseStatsProps): import("react").JSX.Element;
