import { type DomainFrameProps } from '../../internal/domain.js';
import type { DestinationActivity } from './types.js';
export interface DestinationTimelineProps extends Omit<DomainFrameProps, 'children' | 'onSelect' | 'onChange' | 'onSubmit'> {
    events: readonly DestinationActivity[];
    emptyMessage?: string;
}
export declare function DestinationTimeline(props: DestinationTimelineProps): import("react").JSX.Element;
