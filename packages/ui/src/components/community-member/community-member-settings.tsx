// Generated from scripts/data/domains.txt. One independent export and data contract per module.
'use client';
import { DomainSettings, type DomainFrameProps } from '../../internal/domain.js';
import { config } from './config.js';
import type { CommunityMember, CommunityMemberStatus, CommunityMemberActivity, CommunityMemberMetric, CommunityMemberSettingsValues } from './types.js';
export interface CommunityMemberSettingsProps extends Omit<DomainFrameProps, 'children' | 'onSelect' | 'onChange' | 'onSubmit'> {
    values: CommunityMemberSettingsValues;
    onChange: (key: keyof CommunityMemberSettingsValues, value: boolean) => void;
}
export function CommunityMemberSettings({ onChange, ...props }: CommunityMemberSettingsProps) { return <DomainSettings config={config} {...props} onChange={(key, value) => onChange(key as keyof CommunityMemberSettingsValues, value)}/>; }
