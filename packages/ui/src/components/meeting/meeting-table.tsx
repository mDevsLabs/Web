// Generated from scripts/data/domains.txt. One independent export and data contract per module.
'use client';
import { DomainTable, type DomainFrameProps } from '../../internal/domain.js';
import { config } from './config.js';
import type { Meeting, MeetingStatus, MeetingActivity, MeetingMetric, MeetingSettingsValues } from './types.js';
export interface MeetingTableProps extends Omit<DomainFrameProps, 'children' | 'onSelect' | 'onChange' | 'onSubmit'> {
    items: readonly Meeting[];
    emptyMessage?: string;
}
export function MeetingTable(props: MeetingTableProps) { return <DomainTable config={config} {...props}/>; }
