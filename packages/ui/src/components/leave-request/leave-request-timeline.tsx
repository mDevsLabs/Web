// Generated from scripts/data/domains.txt. One independent export and data contract per module.
'use client';
import { DomainTimeline, type DomainFrameProps } from '../../internal/domain.js';
import { config } from './config.js';
import type { LeaveRequest, LeaveRequestStatus, LeaveRequestActivity, LeaveRequestMetric, LeaveRequestSettingsValues } from './types.js';
export interface LeaveRequestTimelineProps extends Omit<DomainFrameProps, 'children' | 'onSelect' | 'onChange' | 'onSubmit'> {
    events: readonly LeaveRequestActivity[];
    emptyMessage?: string;
}
export function LeaveRequestTimeline(props: LeaveRequestTimelineProps) { return <DomainTimeline config={config} {...props}/>; }
