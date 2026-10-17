import { type DomainFrameProps } from '../../internal/domain.js';
import type { CommunityMember } from './types.js';
export interface CommunityMemberTableProps extends Omit<DomainFrameProps, 'children' | 'onSelect' | 'onChange' | 'onSubmit'> {
    items: readonly CommunityMember[];
    emptyMessage?: string;
}
export declare function CommunityMemberTable(props: CommunityMemberTableProps): import("react").JSX.Element;
