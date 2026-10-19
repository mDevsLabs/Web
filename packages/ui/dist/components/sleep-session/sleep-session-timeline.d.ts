import { type DomainFrameProps } from '../../internal/domain.js';
import type { SleepSessionActivity } from './types.js';
export interface SleepSessionTimelineProps extends Omit<DomainFrameProps, 'children' | 'onSelect' | 'onChange' | 'onSubmit'> {
    events: readonly SleepSessionActivity[];
    emptyMessage?: string;
}
export declare function SleepSessionTimeline(props: SleepSessionTimelineProps): import("react").JSX.Element;
