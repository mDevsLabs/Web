// Generated from scripts/data/domains.txt. One independent export and data contract per module.
'use client';
import { DomainList, type DomainFrameProps } from '../../internal/domain.js';
import { config } from './config.js';
import type { CommunityMember, CommunityMemberStatus, CommunityMemberActivity, CommunityMemberMetric, CommunityMemberSettingsValues } from './types.js';
export interface CommunityMemberListProps extends Omit<DomainFrameProps, 'children' | 'onSelect' | 'onChange' | 'onSubmit'> {
    items: readonly CommunityMember[];
    onSelect?: (item: CommunityMember) => void;
    emptyMessage?: string;
}
export function CommunityMemberList({ onSelect, ...props }: CommunityMemberListProps) { return <DomainList config={config} {...props} onSelect={onSelect ? item => onSelect(item as CommunityMember) : undefined}/>; }
