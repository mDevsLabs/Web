// Generated from scripts/data/domains.txt. One independent export and data contract per module.
'use client';
import { DomainOverview, type DomainFrameProps } from '../../internal/domain.js';
import { config } from './config.js';
import type { Meeting, MeetingStatus, MeetingActivity, MeetingMetric, MeetingSettingsValues } from './types.js';
export interface MeetingOverviewProps extends Omit<DomainFrameProps, 'children' | 'onSelect' | 'onChange' | 'onSubmit'> {
    items: readonly Meeting[];
    metrics: readonly MeetingMetric[];
}
export function MeetingOverview(props: MeetingOverviewProps) { return <DomainOverview config={config} {...props}/>; }
