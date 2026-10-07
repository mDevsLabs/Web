import { type DomainFrameProps } from '../../internal/domain.js';
import type { StudentActivity } from './types.js';
export interface StudentTimelineProps extends Omit<DomainFrameProps, 'children' | 'onSelect' | 'onChange' | 'onSubmit'> {
    events: readonly StudentActivity[];
    emptyMessage?: string;
}
export declare function StudentTimeline(props: StudentTimelineProps): import("react").JSX.Element;
