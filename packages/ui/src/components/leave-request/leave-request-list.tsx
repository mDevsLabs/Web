// Generated from scripts/data/domains.txt. One independent export and data contract per module.
'use client';
import { DomainList, type DomainFrameProps } from '../../internal/domain.js';
import { config } from './config.js';
import type { LeaveRequest, LeaveRequestStatus, LeaveRequestActivity, LeaveRequestMetric, LeaveRequestSettingsValues } from './types.js';
export interface LeaveRequestListProps extends Omit<DomainFrameProps, 'children' | 'onSelect' | 'onChange' | 'onSubmit'> {
    items: readonly LeaveRequest[];
    onSelect?: (item: LeaveRequest) => void;
    emptyMessage?: string;
}
export function LeaveRequestList({ onSelect, ...props }: LeaveRequestListProps) { return <DomainList config={config} {...props} onSelect={onSelect ? item => onSelect(item as LeaveRequest) : undefined}/>; }
