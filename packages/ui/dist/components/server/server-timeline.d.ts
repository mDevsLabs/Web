import { type DomainFrameProps } from '../../internal/domain.js';
import type { ServerActivity } from './types.js';
export interface ServerTimelineProps extends Omit<DomainFrameProps, 'children' | 'onSelect' | 'onChange' | 'onSubmit'> {
    events: readonly ServerActivity[];
    emptyMessage?: string;
}
export declare function ServerTimeline(props: ServerTimelineProps): import("react").JSX.Element;
