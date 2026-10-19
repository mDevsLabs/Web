import { type DomainFrameProps } from '../../internal/domain.js';
import type { Course } from './types.js';
export interface CourseCardProps extends Omit<DomainFrameProps, 'children' | 'onSelect' | 'onChange' | 'onSubmit'> {
    item: Course;
}
export declare function CourseCard(props: CourseCardProps): import("react").JSX.Element;
