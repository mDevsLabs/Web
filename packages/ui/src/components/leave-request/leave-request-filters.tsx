// Generated from scripts/data/domains.txt. One independent export and data contract per module.
'use client';
import { DomainFilters, type DomainFrameProps } from '../../internal/domain.js';
import { config } from './config.js';
import type { LeaveRequest, LeaveRequestStatus, LeaveRequestActivity, LeaveRequestMetric, LeaveRequestSettingsValues } from './types.js';
export interface LeaveRequestFiltersProps extends Omit<DomainFrameProps, 'children' | 'onSelect' | 'onChange' | 'onSubmit'> {
    query: string;
    status?: LeaveRequestStatus | '';
    onQueryChange: (query: string) => void;
    onStatusChange?: (status: LeaveRequestStatus | '') => void;
}
export function LeaveRequestFilters({ onStatusChange, ...props }: LeaveRequestFiltersProps) { return <DomainFilters config={config} {...props} onStatusChange={onStatusChange ? value => onStatusChange(value as LeaveRequestStatus | '') : undefined}/>; }
