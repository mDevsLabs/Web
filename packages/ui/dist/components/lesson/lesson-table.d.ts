import { type DomainFrameProps } from '../../internal/domain.js';
import type { Lesson } from './types.js';
export interface LessonTableProps extends Omit<DomainFrameProps, 'children' | 'onSelect' | 'onChange' | 'onSubmit'> {
    items: readonly Lesson[];
    emptyMessage?: string;
}
export declare function LessonTable(props: LessonTableProps): import("react").JSX.Element;
