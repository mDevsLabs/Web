import { type DomainFrameProps } from '../../internal/domain.js';
import type { CommunityMemberActivity } from './types.js';
export interface CommunityMemberTimelineProps extends Omit<DomainFrameProps, 'children' | 'onSelect' | 'onChange' | 'onSubmit'> {
    events: readonly CommunityMemberActivity[];
    emptyMessage?: string;
}
export declare function CommunityMemberTimeline(props: CommunityMemberTimelineProps): import("react").JSX.Element;
