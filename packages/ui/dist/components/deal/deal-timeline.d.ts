import { type DomainFrameProps } from '../../internal/domain.js';
import type { DealActivity } from './types.js';
export interface DealTimelineProps extends Omit<DomainFrameProps, 'children' | 'onSelect' | 'onChange' | 'onSubmit'> {
    events: readonly DealActivity[];
    emptyMessage?: string;
}
export declare function DealTimeline(props: DealTimelineProps): import("react").JSX.Element;
