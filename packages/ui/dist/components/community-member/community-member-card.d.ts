import { type DomainFrameProps } from '../../internal/domain.js';
import type { CommunityMember } from './types.js';
export interface CommunityMemberCardProps extends Omit<DomainFrameProps, 'children' | 'onSelect' | 'onChange' | 'onSubmit'> {
    item: CommunityMember;
}
export declare function CommunityMemberCard(props: CommunityMemberCardProps): import("react").JSX.Element;
