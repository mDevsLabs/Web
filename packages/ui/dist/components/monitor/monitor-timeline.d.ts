import { type DomainFrameProps } from '../../internal/domain.js';
import type { MonitorActivity } from './types.js';
export interface MonitorTimelineProps extends Omit<DomainFrameProps, 'children' | 'onSelect' | 'onChange' | 'onSubmit'> {
    events: readonly MonitorActivity[];
    emptyMessage?: string;
}
export declare function MonitorTimeline(props: MonitorTimelineProps): import("react").JSX.Element;
