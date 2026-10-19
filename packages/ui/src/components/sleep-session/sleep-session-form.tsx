// Generated from scripts/data/domains.txt. One independent export and data contract per module.
'use client';
import { DomainForm, type DomainFrameProps } from '../../internal/domain.js';
import { config } from './config.js';
import type { SleepSession, SleepSessionStatus, SleepSessionActivity, SleepSessionMetric, SleepSessionSettingsValues } from './types.js';
export interface SleepSessionFormProps extends Omit<DomainFrameProps, 'children' | 'onSelect' | 'onChange' | 'onSubmit'> {
    initialValues?: Partial<SleepSession>;
    onSubmit: (value: Omit<SleepSession, 'id'>) => void;
    submitLabel?: string;
    pending?: boolean;
}
export function SleepSessionForm({ onSubmit, ...props }: SleepSessionFormProps) { return <DomainForm config={config} {...props} onSubmit={values => onSubmit(values as Omit<SleepSession, 'id'>)}/>; }
