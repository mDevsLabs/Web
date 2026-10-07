// Generated from scripts/data/domains.txt. One independent export and data contract per module.
'use client';
import { DomainCard, type DomainFrameProps } from '../../internal/domain.js';
import { config } from './config.js';
import type { CommunityMember, CommunityMemberStatus, CommunityMemberActivity, CommunityMemberMetric, CommunityMemberSettingsValues } from './types.js';
export interface CommunityMemberCardProps extends Omit<DomainFrameProps, 'children' | 'onSelect' | 'onChange' | 'onSubmit'> {
    item: CommunityMember;
}
export function CommunityMemberCard(props: CommunityMemberCardProps) { return <DomainCard config={config} {...props}/>; }
