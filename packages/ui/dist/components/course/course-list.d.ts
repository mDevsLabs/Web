import { type DomainFrameProps } from '../../internal/domain.js';
import type { Course } from './types.js';
export interface CourseListProps extends Omit<DomainFrameProps, 'children' | 'onSelect' | 'onChange' | 'onSubmit'> {
    items: readonly Course[];
    onSelect?: (item: Course) => void;
    emptyMessage?: string;
}
export declare function CourseList({ onSelect, ...props }: CourseListProps): import("react").JSX.Element;
