import { type DomainFrameProps } from '../../internal/domain.js';
import type { CommunityMemberMetric } from './types.js';
export interface CommunityMemberStatsProps extends Omit<DomainFrameProps, 'children' | 'onSelect' | 'onChange' | 'onSubmit'> {
    metrics: readonly CommunityMemberMetric[];
}
export declare function CommunityMemberStats(props: CommunityMemberStatsProps): import("react").JSX.Element;
