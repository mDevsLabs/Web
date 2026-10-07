// Generated from scripts/data/domains.txt. One independent export and data contract per module.
'use client';
import { DomainSettings, type DomainFrameProps } from '../../internal/domain.js';
import { config } from './config.js';
import type { LeaveRequest, LeaveRequestStatus, LeaveRequestActivity, LeaveRequestMetric, LeaveRequestSettingsValues } from './types.js';
export interface LeaveRequestSettingsProps extends Omit<DomainFrameProps, 'children' | 'onSelect' | 'onChange' | 'onSubmit'> {
    values: LeaveRequestSettingsValues;
    onChange: (key: keyof LeaveRequestSettingsValues, value: boolean) => void;
}
export function LeaveRequestSettings({ onChange, ...props }: LeaveRequestSettingsProps) { return <DomainSettings config={config} {...props} onChange={(key, value) => onChange(key as keyof LeaveRequestSettingsValues, value)}/>; }
