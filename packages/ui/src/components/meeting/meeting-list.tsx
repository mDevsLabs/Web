// Generated from scripts/data/domains.txt. One independent export and data contract per module.
'use client';
import { DomainList, type DomainFrameProps } from '../../internal/domain.js';
import { config } from './config.js';
import type { Meeting, MeetingStatus, MeetingActivity, MeetingMetric, MeetingSettingsValues } from './types.js';
export interface MeetingListProps extends Omit<DomainFrameProps, 'children' | 'onSelect' | 'onChange' | 'onSubmit'> {
    items: readonly Meeting[];
    onSelect?: (item: Meeting) => void;
    emptyMessage?: string;
}
export function MeetingList({ onSelect, ...props }: MeetingListProps) { return <DomainList config={config} {...props} onSelect={onSelect ? item => onSelect(item as Meeting) : undefined}/>; }
