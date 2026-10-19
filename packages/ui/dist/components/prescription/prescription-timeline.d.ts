import { type DomainFrameProps } from '../../internal/domain.js';
import type { PrescriptionActivity } from './types.js';
export interface PrescriptionTimelineProps extends Omit<DomainFrameProps, 'children' | 'onSelect' | 'onChange' | 'onSubmit'> {
    events: readonly PrescriptionActivity[];
    emptyMessage?: string;
}
export declare function PrescriptionTimeline(props: PrescriptionTimelineProps): import("react").JSX.Element;
