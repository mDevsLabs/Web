// Generated from scripts/data/domains.txt. One independent export and data contract per module.
'use client';
import { DomainCard, type DomainFrameProps } from '../../internal/domain.js';
import { config } from './config.js';
import type { LeaveRequest, LeaveRequestStatus, LeaveRequestActivity, LeaveRequestMetric, LeaveRequestSettingsValues } from './types.js';
export interface LeaveRequestCardProps extends Omit<DomainFrameProps, 'children' | 'onSelect' | 'onChange' | 'onSubmit'> {
    item: LeaveRequest;
}
export function LeaveRequestCard(props: LeaveRequestCardProps) { return <DomainCard config={config} {...props}/>; }
