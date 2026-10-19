import { type DomainFrameProps } from '../../internal/domain.js';
import type { ReleaseActivity } from './types.js';
export interface ReleaseTimelineProps extends Omit<DomainFrameProps, 'children' | 'onSelect' | 'onChange' | 'onSubmit'> {
    events: readonly ReleaseActivity[];
    emptyMessage?: string;
}
export declare function ReleaseTimeline(props: ReleaseTimelineProps): import("react").JSX.Element;
