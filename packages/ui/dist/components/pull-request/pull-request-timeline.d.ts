import { type DomainFrameProps } from '../../internal/domain.js';
import type { PullRequestActivity } from './types.js';
export interface PullRequestTimelineProps extends Omit<DomainFrameProps, 'children' | 'onSelect' | 'onChange' | 'onSubmit'> {
    events: readonly PullRequestActivity[];
    emptyMessage?: string;
}
export declare function PullRequestTimeline(props: PullRequestTimelineProps): import("react").JSX.Element;
