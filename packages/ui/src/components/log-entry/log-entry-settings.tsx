// Generated from scripts/data/domains.txt. One independent export and data contract per module.
'use client';
import { DomainSettings, type DomainFrameProps } from '../../internal/domain.js';
import { config } from './config.js';
import type { LogEntry, LogEntryStatus, LogEntryActivity, LogEntryMetric, LogEntrySettingsValues } from './types.js';
export interface LogEntrySettingsProps extends Omit<DomainFrameProps, 'children' | 'onSelect' | 'onChange' | 'onSubmit'> {
    values: LogEntrySettingsValues;
    onChange: (key: keyof LogEntrySettingsValues, value: boolean) => void;
}
export function LogEntrySettings({ onChange, ...props }: LogEntrySettingsProps) { return <DomainSettings config={config} {...props} onChange={(key, value) => onChange(key as keyof LogEntrySettingsValues, value)}/>; }
