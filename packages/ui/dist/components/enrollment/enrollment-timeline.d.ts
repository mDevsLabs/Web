import { type DomainFrameProps } from '../../internal/domain.js';
import type { EnrollmentActivity } from './types.js';
export interface EnrollmentTimelineProps extends Omit<DomainFrameProps, 'children' | 'onSelect' | 'onChange' | 'onSubmit'> {
    events: readonly EnrollmentActivity[];
    emptyMessage?: string;
}
export declare function EnrollmentTimeline(props: EnrollmentTimelineProps): import("react").JSX.Element;
