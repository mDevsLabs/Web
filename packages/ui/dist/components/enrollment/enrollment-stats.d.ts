import { type DomainFrameProps } from '../../internal/domain.js';
import type { EnrollmentMetric } from './types.js';
export interface EnrollmentStatsProps extends Omit<DomainFrameProps, 'children' | 'onSelect' | 'onChange' | 'onSubmit'> {
    metrics: readonly EnrollmentMetric[];
}
export declare function EnrollmentStats(props: EnrollmentStatsProps): import("react").JSX.Element;
