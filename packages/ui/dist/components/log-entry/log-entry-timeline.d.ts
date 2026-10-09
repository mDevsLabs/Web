import { type DomainFrameProps } from '../../internal/domain.js';
import type { LogEntryActivity } from './types.js';
export interface LogEntryTimelineProps extends Omit<DomainFrameProps, 'children' | 'onSelect' | 'onChange' | 'onSubmit'> {
    events: readonly LogEntryActivity[];
    emptyMessage?: string;
}
export declare function LogEntryTimeline(props: LogEntryTimelineProps): import("react").JSX.Element;
