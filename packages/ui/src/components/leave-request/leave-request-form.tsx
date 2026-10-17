// Generated from scripts/data/domains.txt. One independent export and data contract per module.
'use client';
import { DomainForm, type DomainFrameProps } from '../../internal/domain.js';
import { config } from './config.js';
import type { LeaveRequest, LeaveRequestStatus, LeaveRequestActivity, LeaveRequestMetric, LeaveRequestSettingsValues } from './types.js';
export interface LeaveRequestFormProps extends Omit<DomainFrameProps, 'children' | 'onSelect' | 'onChange' | 'onSubmit'> {
    initialValues?: Partial<LeaveRequest>;
    onSubmit: (value: Omit<LeaveRequest, 'id'>) => void;
    submitLabel?: string;
    pending?: boolean;
}
export function LeaveRequestForm({ onSubmit, ...props }: LeaveRequestFormProps) { return <DomainForm config={config} {...props} onSubmit={values => onSubmit(values as Omit<LeaveRequest, 'id'>)}/>; }
