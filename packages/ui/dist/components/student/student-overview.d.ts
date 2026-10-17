import { type DomainFrameProps } from '../../internal/domain.js';
import type { Student, StudentMetric } from './types.js';
export interface StudentOverviewProps extends Omit<DomainFrameProps, 'children' | 'onSelect' | 'onChange' | 'onSubmit'> {
    items: readonly Student[];
    metrics: readonly StudentMetric[];
}
export declare function StudentOverview(props: StudentOverviewProps): import("react").JSX.Element;
