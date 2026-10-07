import { type DomainFrameProps } from '../../internal/domain.js';
import type { Lesson } from './types.js';
export interface LessonListProps extends Omit<DomainFrameProps, 'children' | 'onSelect' | 'onChange' | 'onSubmit'> {
    items: readonly Lesson[];
    onSelect?: (item: Lesson) => void;
    emptyMessage?: string;
}
export declare function LessonList({ onSelect, ...props }: LessonListProps): import("react").JSX.Element;
