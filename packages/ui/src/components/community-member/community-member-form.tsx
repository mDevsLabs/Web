// Generated from scripts/data/domains.txt. One independent export and data contract per module.
'use client';
import { DomainForm, type DomainFrameProps } from '../../internal/domain.js';
import { config } from './config.js';
import type { CommunityMember, CommunityMemberStatus, CommunityMemberActivity, CommunityMemberMetric, CommunityMemberSettingsValues } from './types.js';
export interface CommunityMemberFormProps extends Omit<DomainFrameProps, 'children' | 'onSelect' | 'onChange' | 'onSubmit'> {
    initialValues?: Partial<CommunityMember>;
    onSubmit: (value: Omit<CommunityMember, 'id'>) => void;
    submitLabel?: string;
    pending?: boolean;
}
export function CommunityMemberForm({ onSubmit, ...props }: CommunityMemberFormProps) { return <DomainForm config={config} {...props} onSubmit={values => onSubmit(values as Omit<CommunityMember, 'id'>)}/>; }
