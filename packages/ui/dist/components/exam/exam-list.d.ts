import { type DomainFrameProps } from '../../internal/domain.js';
import type { Exam } from './types.js';
export interface ExamListProps extends Omit<DomainFrameProps, 'children' | 'onSelect' | 'onChange' | 'onSubmit'> {
    items: readonly Exam[];
    onSelect?: (item: Exam) => void;
    emptyMessage?: string;
}
export declare function ExamList({ onSelect, ...props }: ExamListProps): import("react").JSX.Element;
