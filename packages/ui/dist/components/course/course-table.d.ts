import { type DomainFrameProps } from '../../internal/domain.js';
import type { Course } from './types.js';
export interface CourseTableProps extends Omit<DomainFrameProps, 'children' | 'onSelect' | 'onChange' | 'onSubmit'> {
    items: readonly Course[];
    emptyMessage?: string;
}
export declare function CourseTable(props: CourseTableProps): import("react").JSX.Element;
