import { type DomainFrameProps } from '../../internal/domain.js';
import type { CommunityMember } from './types.js';
export interface CommunityMemberListProps extends Omit<DomainFrameProps, 'children' | 'onSelect' | 'onChange' | 'onSubmit'> {
    items: readonly CommunityMember[];
    onSelect?: (item: CommunityMember) => void;
    emptyMessage?: string;
}
export declare function CommunityMemberList({ onSelect, ...props }: CommunityMemberListProps): import("react").JSX.Element;
