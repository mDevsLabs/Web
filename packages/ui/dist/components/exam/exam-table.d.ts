import { type DomainFrameProps } from '../../internal/domain.js';
import type { Exam } from './types.js';
export interface ExamTableProps extends Omit<DomainFrameProps, 'children' | 'onSelect' | 'onChange' | 'onSubmit'> {
    items: readonly Exam[];
    emptyMessage?: string;
}
export declare function ExamTable(props: ExamTableProps): import("react").JSX.Element;
