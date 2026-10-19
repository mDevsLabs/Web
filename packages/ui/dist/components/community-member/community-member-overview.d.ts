import { type DomainFrameProps } from '../../internal/domain.js';
import type { CommunityMember, CommunityMemberMetric } from './types.js';
export interface CommunityMemberOverviewProps extends Omit<DomainFrameProps, 'children' | 'onSelect' | 'onChange' | 'onSubmit'> {
    items: readonly CommunityMember[];
    metrics: readonly CommunityMemberMetric[];
}
export declare function CommunityMemberOverview(props: CommunityMemberOverviewProps): import("react").JSX.Element;
