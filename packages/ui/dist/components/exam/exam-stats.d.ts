import { type DomainFrameProps } from '../../internal/domain.js';
import type { ExamMetric } from './types.js';
export interface ExamStatsProps extends Omit<DomainFrameProps, 'children' | 'onSelect' | 'onChange' | 'onSubmit'> {
    metrics: readonly ExamMetric[];
}
export declare function ExamStats(props: ExamStatsProps): import("react").JSX.Element;
