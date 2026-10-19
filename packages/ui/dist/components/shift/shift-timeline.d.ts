import { type DomainFrameProps } from '../../internal/domain.js';
import type { ShiftActivity } from './types.js';
export interface ShiftTimelineProps extends Omit<DomainFrameProps, 'children' | 'onSelect' | 'onChange' | 'onSubmit'> {
    events: readonly ShiftActivity[];
    emptyMessage?: string;
}
export declare function ShiftTimeline(props: ShiftTimelineProps): import("react").JSX.Element;
