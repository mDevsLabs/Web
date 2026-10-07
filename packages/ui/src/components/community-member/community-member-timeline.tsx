// Generated from scripts/data/domains.txt. One independent export and data contract per module.
'use client';
import { DomainTimeline, type DomainFrameProps } from '../../internal/domain.js';
import { config } from './config.js';
import type { CommunityMember, CommunityMemberStatus, CommunityMemberActivity, CommunityMemberMetric, CommunityMemberSettingsValues } from './types.js';
export interface CommunityMemberTimelineProps extends Omit<DomainFrameProps, 'children' | 'onSelect' | 'onChange' | 'onSubmit'> {
    events: readonly CommunityMemberActivity[];
    emptyMessage?: string;
}
export function CommunityMemberTimeline(props: CommunityMemberTimelineProps) { return <DomainTimeline config={config} {...props}/>; }
