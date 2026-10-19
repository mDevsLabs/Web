import { type DomainFrameProps } from '../../internal/domain.js';
import type { IssueActivity } from './types.js';
export interface IssueTimelineProps extends Omit<DomainFrameProps, 'children' | 'onSelect' | 'onChange' | 'onSubmit'> {
    events: readonly IssueActivity[];
    emptyMessage?: string;
}
export declare function IssueTimeline(props: IssueTimelineProps): import("react").JSX.Element;
