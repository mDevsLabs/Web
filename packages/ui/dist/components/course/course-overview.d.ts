import { type DomainFrameProps } from '../../internal/domain.js';
import type { Course, CourseMetric } from './types.js';
export interface CourseOverviewProps extends Omit<DomainFrameProps, 'children' | 'onSelect' | 'onChange' | 'onSubmit'> {
    items: readonly Course[];
    metrics: readonly CourseMetric[];
}
export declare function CourseOverview(props: CourseOverviewProps): import("react").JSX.Element;
