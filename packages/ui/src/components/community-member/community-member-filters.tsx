// Generated from scripts/data/domains.txt. One independent export and data contract per module.
'use client';
import { DomainFilters, type DomainFrameProps } from '../../internal/domain.js';
import { config } from './config.js';
import type { CommunityMember, CommunityMemberStatus, CommunityMemberActivity, CommunityMemberMetric, CommunityMemberSettingsValues } from './types.js';
export interface CommunityMemberFiltersProps extends Omit<DomainFrameProps, 'children' | 'onSelect' | 'onChange' | 'onSubmit'> {
    query: string;
    status?: CommunityMemberStatus | '';
    onQueryChange: (query: string) => void;
    onStatusChange?: (status: CommunityMemberStatus | '') => void;
}
export function CommunityMemberFilters({ onStatusChange, ...props }: CommunityMemberFiltersProps) { return <DomainFilters config={config} {...props} onStatusChange={onStatusChange ? value => onStatusChange(value as CommunityMemberStatus | '') : undefined}/>; }
