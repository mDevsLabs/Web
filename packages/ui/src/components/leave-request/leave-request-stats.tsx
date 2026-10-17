// Generated from scripts/data/domains.txt. One independent export and data contract per module.
'use client';
import { DomainStats, type DomainFrameProps } from '../../internal/domain.js';
import { config } from './config.js';
import type { LeaveRequest, LeaveRequestStatus, LeaveRequestActivity, LeaveRequestMetric, LeaveRequestSettingsValues } from './types.js';
export interface LeaveRequestStatsProps extends Omit<DomainFrameProps, 'children' | 'onSelect' | 'onChange' | 'onSubmit'> {
    metrics: readonly LeaveRequestMetric[];
}
export function LeaveRequestStats(props: LeaveRequestStatsProps) { return <DomainStats config={config} {...props}/>; }
