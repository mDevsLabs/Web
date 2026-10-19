import { type DomainFrameProps } from '../../internal/domain.js';
import type { Lesson } from './types.js';
export interface LessonCardProps extends Omit<DomainFrameProps, 'children' | 'onSelect' | 'onChange' | 'onSubmit'> {
    item: Lesson;
}
export declare function LessonCard(props: LessonCardProps): import("react").JSX.Element;
