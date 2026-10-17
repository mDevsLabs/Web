import { type DomainFrameProps } from '../../internal/domain.js';
import type { Exam, ExamMetric } from './types.js';
export interface ExamOverviewProps extends Omit<DomainFrameProps, 'children' | 'onSelect' | 'onChange' | 'onSubmit'> {
    items: readonly Exam[];
    metrics: readonly ExamMetric[];
}
export declare function ExamOverview(props: ExamOverviewProps): import("react").JSX.Element;
