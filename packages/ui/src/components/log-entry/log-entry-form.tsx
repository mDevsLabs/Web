// Generated from scripts/data/domains.txt. One independent export and data contract per module.
'use client';
import { DomainForm, type DomainFrameProps } from '../../internal/domain.js';
import { config } from './config.js';
import type { LogEntry, LogEntryStatus, LogEntryActivity, LogEntryMetric, LogEntrySettingsValues } from './types.js';
export interface LogEntryFormProps extends Omit<DomainFrameProps, 'children' | 'onSelect' | 'onChange' | 'onSubmit'> {
    initialValues?: Partial<LogEntry>;
    onSubmit: (value: Omit<LogEntry, 'id'>) => void;
    submitLabel?: string;
    pending?: boolean;
}
export function LogEntryForm({ onSubmit, ...props }: LogEntryFormProps) { return <DomainForm config={config} {...props} onSubmit={values => onSubmit(values as Omit<LogEntry, 'id'>)}/>; }
