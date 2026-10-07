import { type DomainFrameProps } from '../../internal/domain.js';
import type { Enrollment, EnrollmentMetric } from './types.js';
export interface EnrollmentOverviewProps extends Omit<DomainFrameProps, 'children' | 'onSelect' | 'onChange' | 'onSubmit'> {
    items: readonly Enrollment[];
    metrics: readonly EnrollmentMetric[];
}
export declare function EnrollmentOverview(props: EnrollmentOverviewProps): import("react").JSX.Element;
