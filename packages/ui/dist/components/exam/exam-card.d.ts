import { type DomainFrameProps } from '../../internal/domain.js';
import type { Exam } from './types.js';
export interface ExamCardProps extends Omit<DomainFrameProps, 'children' | 'onSelect' | 'onChange' | 'onSubmit'> {
    item: Exam;
}
export declare function ExamCard(props: ExamCardProps): import("react").JSX.Element;
