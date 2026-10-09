import { type DomainFrameProps } from '../../internal/domain.js';
import type { StudentMetric } from './types.js';
export interface StudentStatsProps extends Omit<DomainFrameProps, 'children' | 'onSelect' | 'onChange' | 'onSubmit'> {
    metrics: readonly StudentMetric[];
}
export declare function StudentStats(props: StudentStatsProps): import("react").JSX.Element;
